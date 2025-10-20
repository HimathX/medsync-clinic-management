"""
Core Authentication Module
Handles JWT token operations, password hashing, and session management
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
import hashlib
import logging
import mysql.connector
import uuid
import os

from core.database import get_db

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# OAuth2 scheme - CHANGE tokenUrl to /token endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


# ============================================
# ROLE MAPPING
# ============================================

def map_backend_role_to_db_role(backend_role: str) -> str:
    """
    Map backend role to database role name
    
    Args:
        backend_role: Role from employee.role ENUM (admin, doctor, nurse, etc.)
        
    Returns:
        Database role name (medsync_admin, medsync_doctor, etc.)
    """
    role_mapping = {
        'admin': 'medsync_admin',
        'manager': 'medsync_manager',
        'doctor': 'medsync_doctor',
        'nurse': 'medsync_nurse',
        'receptionist': 'medsync_receptionist',
        'pharmacist': 'medsync_pharmacist',
        'patient': 'medsync_patient'
    }
    
    return role_mapping.get(backend_role.lower(), 'medsync_readonly')


def get_user_db_role(user_type: str, employee_role: Optional[str] = None) -> str:
    """
    Get database role for user based on user_type and employee role
    
    Args:
        user_type: User type from user.user_type (employee, patient)
        employee_role: Employee role from employee.role (if employee)
        
    Returns:
        Database role name for authorization
    """
    if user_type == 'patient':
        return 'medsync_patient'
    
    if user_type == 'employee' and employee_role:
        return map_backend_role_to_db_role(employee_role)
    
    # Default fallback
    return 'medsync_readonly'


# ============================================
# PASSWORD UTILITIES
# ============================================

def hash_password(password: str) -> str:
    """
    Hash password using SHA-256 to match database implementation
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
        
    Raises:
        ValueError: If password hashing fails
    """
    try:
        print(f"   🔐 [HASH] Input password length: {len(password)}")
        hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
        print(f"   ✅ [HASH] Output hash: {hashed[:20]}...")
        return hashed
    except Exception as e:
        print(f"   ❌ [HASH] Error: {str(e)}")
        logger.error(f"Error hashing password: {str(e)}")
        raise ValueError("Failed to hash password")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hash to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        return hash_password(plain_password) == hashed_password
    except Exception:
        return False


# ============================================
# JWT TOKEN OPERATIONS
# ============================================

def create_access_token(
    data: dict, 
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime, str]:
    """
    Create JWT access token
    
    Args:
        data: Token payload data
        expires_delta: Optional custom expiration time
        
    Returns:
        Tuple of (encoded_jwt, expiration_datetime, session_id)
    """
    print(f"\n   🎫 [JWT] Creating token for: {data.get('email')}")
    
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Add standard claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "session_id": session_id
    })
    
    print(f"   ⏰ [JWT] Expires at: {expire}")
    print(f"   🔑 [JWT] Session ID: {session_id}")
    
    # Encode JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    print(f"   ✅ [JWT] Token created: {encoded_jwt[:50]}...")
    
    return encoded_jwt, expire, session_id


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================
# DATABASE SESSION OPERATIONS
# ============================================

def create_user_session(
    user_id: str,
    user_role: str,
    branch_id: Optional[str],
    session_id: str,
    ip_address: str,
    user_agent: str
) -> bool:
    """
    Create user session in database using SetUserContext stored procedure
    
    Args:
        user_id: User UUID
        user_role: User role (admin, doctor, patient, etc.) - will be mapped to DB role
        branch_id: Branch UUID (optional)
        session_id: Session UUID
        ip_address: Client IP address
        user_agent: Client user agent string
        
    Returns:
        True if session created successfully, False otherwise
    """
    print(f"\n   💾 [SESSION] Creating session:")
    print(f"      User ID: {user_id}")
    print(f"      Role: {user_role}")
    print(f"      Branch: {branch_id}")
    print(f"      Session: {session_id}")
    print(f"      IP: {ip_address}")
    
    try:
        with get_db() as (cursor, connection):
            # Call SetUserContext stored procedure
            cursor.callproc('SetUserContext', [
                session_id,
                user_id,
                user_role,
                branch_id,
                ip_address,
                user_agent
            ])
            
            connection.commit()
            print(f"   ✅ [SESSION] Session created successfully")
            logger.info(f"Session created: {session_id} for user {user_id}")
            
            # Log to audit_log
            cursor.execute("""
                INSERT INTO audit_log (
                    user_id, action_type, table_name, session_id, 
                    ip_address, user_agent, new_values
                ) VALUES (
                    %s, 'LOGIN', 'user_session', %s, %s, %s,
                    JSON_OBJECT('session_id', %s, 'user_role', %s, 'branch_id', %s)
                )
            """, (user_id, session_id, ip_address, user_agent, session_id, user_role, branch_id))
            
            connection.commit()
            return True
            
    except mysql.connector.Error as e:
        print(f"   ❌ [SESSION] Database error: {str(e)}")
        logger.error(f"Session creation error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ [SESSION] Unexpected error: {str(e)}")
        logger.error(f"Unexpected session creation error: {e}")
        return False


def verify_session(session_id: str) -> bool:
    """
    Verify session is active using GetCurrentUserId database function
    
    Args:
        session_id: Session UUID to verify
        
    Returns:
        True if session is active, False otherwise
    """
    try:
        with get_db() as (cursor, connection):
            # Use GetCurrentUserId function from database
            cursor.execute("SELECT GetCurrentUserId(%s) as user_id", (session_id,))
            result = cursor.fetchone()
            
            # Update last activity if session is valid
            if result and result.get('user_id'):
                cursor.execute("""
                    UPDATE user_session 
                    SET last_activity = NOW() 
                    WHERE session_id = %s
                """, (session_id,))
                connection.commit()
                return True
            
            return False
            
    except mysql.connector.Error as e:
        logger.error(f"Session verification error: {e}")
        return False


def invalidate_session(session_id: str) -> bool:
    """
    Invalidate user session using LogoutUser stored procedure
    
    Args:
        session_id: Session UUID to invalidate
        
    Returns:
        True if session invalidated successfully, False otherwise
    """
    try:
        with get_db() as (cursor, connection):
            # Call LogoutUser stored procedure
            cursor.callproc('LogoutUser', [session_id])
            connection.commit()
            
            # Log to audit_log
            cursor.execute("""
                INSERT INTO audit_log (
                    user_id, action_type, table_name, session_id, old_values
                ) 
                SELECT 
                    user_id, 
                    'LOGOUT', 
                    'user_session',
                    session_id,
                    JSON_OBJECT(
                        'login_time', login_time,
                        'last_activity', last_activity,
                        'session_duration_minutes', 
                        TIMESTAMPDIFF(MINUTE, login_time, NOW())
                    )
                FROM user_session
                WHERE session_id = %s
            """, (session_id,))
            
            connection.commit()
            logger.info(f"Session invalidated: {session_id}")
            return True
            
    except mysql.connector.Error as e:
        logger.error(f"Session invalidation error: {e}")
        return False


def log_failed_login(
    email: str,
    ip_address: str,
    user_agent: str,
    failure_reason: str
) -> None:
    """
    Log failed login attempt using LogFailedLogin stored procedure
    
    Args:
        email: Email address used in login attempt
        ip_address: Client IP address
        user_agent: Client user agent string
        failure_reason: Reason for failure (INVALID_EMAIL, INVALID_PASSWORD, etc.)
    """
    print(f"\n   ⚠️  [LOGIN] Failed login attempt:")
    print(f"      Email: {email}")
    print(f"      Reason: {failure_reason}")
    print(f"      IP: {ip_address}")
    
    try:
        with get_db() as (cursor, connection):
            cursor.callproc('LogFailedLogin', [
                email,
                ip_address,
                user_agent,
                failure_reason
            ])
            
            connection.commit()
            logger.warning(f"Failed login attempt: {email} - {failure_reason}")
            
    except Exception as e:
        logger.error(f"Error logging failed login: {e}")
        # Don't raise exception - just log it


# ============================================
# USER RETRIEVAL
# ============================================

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user by ID from database
    
    Args:
        user_id: User UUID
        
    Returns:
        User dict with basic info, or None if not found
    """
    try:
        with get_db() as (cursor, connection):
            cursor.execute("""
                SELECT user_id, email, full_name, user_type, created_at
                FROM user 
                WHERE user_id = %s
            """, (user_id,))
            
            return cursor.fetchone()
            
    except mysql.connector.Error as e:
        logger.error(f"Error getting user by ID: {e}")
        return None


def get_employee_details(user_id: str) -> Optional[dict]:
    """
    Get employee details including role and branch
    
    Args:
        user_id: User UUID (employee_id in employee table)
        
    Returns:
        Dictionary with employee details or None if not found
    """
    print(f"\n   🔍 [EMPLOYEE] Fetching details for user_id: {user_id}")
    
    try:
        with get_db() as (cursor, connection):
            cursor.execute("""
                SELECT 
                    employee_id,
                    branch_id,
                    role,
                    salary,
                    joined_date,
                    end_date,
                    is_active
                FROM employee
                WHERE employee_id = %s
            """, (user_id,))
            
            employee = cursor.fetchone()
            
            if employee:
                print(f"   ✅ [EMPLOYEE] Found employee:")
                print(f"      Employee ID: {employee['employee_id']}")
                print(f"      Role: {employee['role']}")
                print(f"      Branch ID: {employee['branch_id']}")
                print(f"      Active: {employee['is_active']}")
                
                return employee
            else:
                print(f"   ⚠️  [EMPLOYEE] No employee record found for user_id: {user_id}")
                return None
                
    except Exception as e:
        print(f"   ❌ [EMPLOYEE] Error: {str(e)}")
        logger.error(f"Error fetching employee details: {e}")
        return None


def get_patient_details(user_id: str) -> Optional[dict]:
    """
    Get patient details
    
    Args:
        user_id: User UUID (patient_id in patient table)
        
    Returns:
        Dictionary with patient details or None if not found
    """
    print(f"\n   🔍 [PATIENT] Fetching details for user_id: {user_id}")
    
    try:
        with get_db() as (cursor, connection):
            cursor.execute("""
                SELECT 
                    patient_id,
                    blood_group,
                    registered_branch_id
                FROM patient
                WHERE patient_id = %s
            """, (user_id,))
            
            patient = cursor.fetchone()
            
            if patient:
                print(f"   ✅ [PATIENT] Found patient:")
                print(f"      Patient ID: {patient['patient_id']}")
                print(f"      Blood Group: {patient['blood_group']}")
                print(f"      Branch ID: {patient['registered_branch_id']}")
                
                return patient
            else:
                print(f"   ⚠️  [PATIENT] No patient record found for user_id: {user_id}")
                return None
                
    except Exception as e:
        print(f"   ❌ [PATIENT] Error: {str(e)}")
        logger.error(f"Error fetching patient details: {e}")
        return None


# ============================================
# AUTHENTICATION DEPENDENCY
# ============================================
def verify_token(token: str) -> Dict[str, Any]:
    """NEW HELPER FUNCTION (doesn't affect existing code)"""
    try:
        payload = verify_token(token)  # ✅ Same result as before
        return payload
    except JWTError as e:
        raise HTTPException(...)
    
    
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user from JWT token
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User dict with role and session information
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        
        if not user_id or not session_id:
            logger.error("Token missing required claims")
            raise credentials_exception
        
        # Verify session is still active in database
        if not verify_session(session_id):
            logger.error(f"Session {session_id} is invalid or expired")
            raise credentials_exception
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise credentials_exception
    
    try:
        # Get user from database
        user = get_user_by_id(user_id)
        
        if not user:
            logger.error(f"User not found: {user_id}")
            raise credentials_exception
        
        # Add session ID to user dict
        user['session_id'] = session_id
        
        # Get employee details if applicable
        if user['user_type'] == 'employee':
            employee = get_employee_details(user_id)
            if employee:
                user.update(employee)
                
                # Add database role mapping for authorization checks
                user['db_role'] = map_backend_role_to_db_role(employee['role'])
        
        # Get patient details if applicable
        elif user['user_type'] == 'patient':
            patient = get_patient_details(user_id)
            if patient:
                user.update(patient)
                
                # Add database role for patients
                user['db_role'] = 'medsync_patient'
        
        logger.debug(f"User authenticated: {user_id} ({user['user_type']}) - DB Role: {user.get('db_role')}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user: {e}")
        raise credentials_exception
