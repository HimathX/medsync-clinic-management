"""
Authentication Router
Handles login, logout, token refresh, and user info endpoints
Supports both JSON and OAuth2 form-based authentication with EMAIL
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends, Form
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import logging
from typing import Optional

from core.auth import (
    hash_password,
    create_access_token,
    create_user_session,
    invalidate_session,
    log_failed_login,
    get_current_user,
    get_employee_details,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from core.database import get_db
from schemas.auth import (
    LoginRequest, 
    LoginResponse, 
    TokenResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================
# OAUTH2 EMAIL/USERNAME FORM DEPENDENCY
# ============================================

async def get_login_form(
    username: str = Form(..., description="Email address or username"),
    password: str = Form(..., description="User password"),
    grant_type: Optional[str] = Form(None),
    scope: str = Form(""),
    client_id: Optional[str] = Form(None),
    client_secret: Optional[str] = Form(None),
) -> dict:
    """
    OAuth2-compatible form that accepts username field but treats it as email
    
    This is required because Swagger UI's OAuth2 implementation always sends 'username'.
    We simply treat the 'username' field as an email address.
    
    OAuth2 spec requires these fields:
    - grant_type (optional, defaults to "password")
    - username (REQUIRED - we use this for email)
    - password (REQUIRED)
    - scope (optional)
    - client_id (optional)
    - client_secret (optional)
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] get_login_form() called")
    print(f"👤 Username (treating as email): {username}")
    print(f"🔑 Password length: {len(password)}")
    print(f"📋 Grant type: {grant_type}")
    print(f"🎯 Scope: {scope}")
    print("="*80 + "\n")
    
    # Validate email format (since username is actually an email)
    if "@" not in username:
        print(f"⚠️  Warning: username doesn't look like an email: {username}")
    
    return {
        "email": username,  # Treat username as email
        "password": password,
        "grant_type": grant_type,
        "scope": scope,
        "client_id": client_id,
        "client_secret": client_secret
    }


# ============================================
# LOGIN ENDPOINTS
# ============================================

@router.post("/login", status_code=status.HTTP_200_OK, response_model=LoginResponse)
async def login_json(credentials: LoginRequest, request: Request):
    """
    Authenticate user with JSON body (email + password)
    
    **Process:**
    1. Validate email exists
    2. Call AuthenticateUser stored procedure
    3. Generate JWT token
    4. Create database session
    5. Return token and user info
    
    **Returns:**
    - JWT access token
    - User information
    - Token expiration time
    
    **Errors:**
    - 401: Invalid credentials
    - 429: Too many failed attempts
    - 500: Server error
    - 503: Database unavailable
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] login_json() endpoint called")
    print(f"📧 Email from JSON: {credentials.email}")
    print(f"🔑 Password length: {len(credentials.password)}")
    print(f"🌐 Client IP: {request.client.host}")
    print(f"🖥️  User-Agent: {request.headers.get('user-agent', 'Unknown')}")
    print("="*80 + "\n")
    
    return await authenticate_user(
        email=credentials.email,
        password=credentials.password,
        request=request
    )


@router.post("/token", status_code=status.HTTP_200_OK, response_model=TokenResponse)
async def login_oauth2(
    request: Request,
    form_data: dict = Depends(get_login_form)
):
    """
    OAuth2-compliant token endpoint (for Swagger UI and OAuth2 clients)
    
    **IMPORTANT:** Swagger UI sends 'username' field by OAuth2 spec.
    This endpoint treats 'username' as EMAIL ADDRESS.
    
    **Form Parameters:**
    - username: Your EMAIL address (e.g., doctor@medsync.com)
    - password: Your password
    - grant_type: "password" (auto-filled)
    
    **Returns:**
    - access_token: JWT token
    - token_type: "bearer"
    - expires_in: Seconds until expiration
    
    **Example:**
    ```
    username=doctor@medsync.com
    password=password123
    grant_type=password
    ```
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] login_oauth2() endpoint called")
    print(f"📧 Email from form (username field): {form_data.get('email')}")
    print(f"🔑 Password present: {bool(form_data.get('password'))}")
    print(f"🌐 Client IP: {request.client.host}")
    print(f"📋 Form data keys: {list(form_data.keys())}")
    print("="*80 + "\n")
    
    login_result = await authenticate_user(
        email=form_data["email"],
        password=form_data["password"],
        request=request
    )
    
    print("\n" + "="*80)
    print("✅ [AUTH] OAuth2 login successful")
    print(f"📧 User: {form_data['email']}")
    print(f"🎫 Token generated: {login_result.access_token[:50]}...")
    print("="*80 + "\n")
    
    # Convert to OAuth2 token response
    return TokenResponse(
        access_token=login_result.access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
    )


# ============================================
# CORE AUTHENTICATION LOGIC
# ============================================

async def authenticate_user(email: str, password: str, request: Request) -> LoginResponse:
    """
    Core authentication logic used by both JSON and OAuth2 endpoints
    
    Args:
        email: User's email address
        password: User's password
        request: FastAPI request object
        
    Returns:
        LoginResponse with token and user info
        
    Raises:
        HTTPException: If authentication fails
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] authenticate_user() called")
    print(f"📧 Email: {email}")
    print(f"🔑 Password length: {len(password)}")
    print("="*80 + "\n")
    
    try:
        logger.info(f"Login attempt for: {email}")
        
        # Hash password using SHA-256
        print("🔐 Hashing password with SHA-256...")
        password_hash = hash_password(password)
        print(f"✅ Password hash: {password_hash[:20]}...")
        
        # Get client info
        ip_address = request.client.host
        user_agent = request.headers.get("user-agent", "Unknown")
        
        print(f"🌐 Client IP: {ip_address}")
        print(f"🖥️  User-Agent: {user_agent}")
        
        with get_db() as (cursor, connection):
            print("\n📊 Checking if user exists...")
            # Check if user exists
            cursor.execute(
                "SELECT COUNT(*) as count FROM user WHERE LOWER(TRIM(email)) = %s",
                (email.lower(),)
            )
            user_exists = cursor.fetchone()
            
            print(f"✅ User exists check: {user_exists}")
            
            if not user_exists or user_exists['count'] == 0:
                print(f"❌ User not found: {email}")
                log_failed_login(email, ip_address, user_agent, 'INVALID_EMAIL')
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            print(f"✅ User found: {email}")
            
            # Call AuthenticateUser stored procedure
            print("\n🔧 Calling AuthenticateUser stored procedure...")
            print(f"   📧 Email: {email}")
            print(f"   🔑 Password hash: {password_hash[:20]}...")
            
            cursor.execute("SET @p_user_id = NULL")
            cursor.execute("SET @p_user_type = NULL")
            cursor.execute("SET @p_full_name = NULL")
            cursor.execute("SET @p_error_message = NULL")
            cursor.execute("SET @p_success = NULL")
            
            cursor.execute("""
                CALL AuthenticateUser(
                    %s, %s,
                    @p_user_id, @p_user_type, @p_full_name,
                    @p_error_message, @p_success
                )
            """, (email, password_hash))
            
            # Get output parameters
            cursor.execute("""
                SELECT 
                    @p_user_id as user_id,
                    @p_user_type as user_type,
                    @p_full_name as full_name,
                    @p_success as success,
                    @p_error_message as error_message
            """)
            result = cursor.fetchone()
            
            print(f"\n📊 Stored procedure result:")
            print(f"   User ID: {result.get('user_id')}")
            print(f"   User Type: {result.get('user_type')}")
            print(f"   Full Name: {result.get('full_name')}")
            print(f"   Success: {result.get('success')}")
            print(f"   Error: {result.get('error_message')}")
            
            # Check authentication result
            if not result or not result.get('success'):
                print(f"❌ Authentication failed: {result.get('error_message')}")
                log_failed_login(email, ip_address, user_agent, 'INVALID_PASSWORD')
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            user_id = result['user_id']
            user_type = result['user_type']
            full_name = result['full_name']
            
            print(f"✅ Authentication successful!")
            print(f"   👤 User: {full_name}")
            print(f"   🆔 ID: {user_id}")
            print(f"   📋 Type: {user_type}")
            
            # Get employee role and branch if applicable
            role = None
            branch_id = None
            
            if user_type == 'employee':
                print("\n🔍 Fetching employee details...")
                employee = get_employee_details(user_id)
                if employee:
                    role = employee['role']
                    branch_id = employee['branch_id']
                    print(f"   👔 Role: {role}")
                    print(f"   🏢 Branch: {branch_id}")
            
            # Create JWT token
            print("\n🎫 Creating JWT token...")
            token_data = {
                "sub": user_id,
                "email": email,
                "user_type": user_type,
                "role": role,
                "branch_id": branch_id
            }
            print(f"   Token data: {token_data}")
            
            access_token, expires_at, session_id = create_access_token(
                data=token_data,
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            
            print(f"✅ JWT token created")
            print(f"   🎫 Token: {access_token[:50]}...")
            print(f"   ⏰ Expires: {expires_at}")
            print(f"   🔑 Session: {session_id}")
            
            # Create database session
            print("\n💾 Creating database session...")
            session_created = create_user_session(
                user_id=user_id,
                user_role=role or user_type,
                branch_id=branch_id,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            if not session_created:
                print("❌ Failed to create session")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create session"
                )
            
            print(f"✅ Session created successfully")
            
            logger.info(f"✅ Login successful: {email}")
            
            print("\n" + "="*80)
            print("🎉 LOGIN COMPLETE")
            print(f"📧 Email: {email}")
            print(f"👤 User: {full_name}")
            print(f"🎫 Token: {access_token[:30]}...")
            print("="*80 + "\n")
            
            return LoginResponse(
                success=True,
                message="Login successful",
                access_token=access_token,
                user_id=user_id,
                user_type=user_type,
                full_name=full_name or "Unknown User",
                email=email,
                role=role,
                branch_id=branch_id,
                expires_at=expires_at
            )
                
    except HTTPException as e:
        print(f"\n❌ HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )


# ============================================
# LOGOUT ENDPOINT
# ============================================

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user and invalidate session
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] logout() called")
    print(f"👤 User: {current_user.get('email')}")
    print(f"🔑 Session: {current_user.get('session_id')}")
    print("="*80 + "\n")
    
    session_id = current_user.get('session_id')
    
    if session_id:
        invalidate_session(session_id)
        logger.info(f"User logged out: {current_user['email']}")
        print(f"✅ Session invalidated: {session_id}")
    
    return {
        "success": True,
        "message": "Logged out successfully"
    }


# ============================================
# USER INFO ENDPOINT
# ============================================

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] get_current_user_info() called")
    print(f"👤 User: {current_user.get('email')}")
    print(f"🆔 User ID: {current_user.get('user_id')}")
    print("="*80 + "\n")
    
    return {
        "user_id": current_user['user_id'],
        "email": current_user['email'],
        "full_name": current_user['full_name'],
        "user_type": current_user['user_type'],
        "role": current_user.get('role'),
        "branch_id": current_user.get('branch_id'),
        "employee_id": current_user.get('employee_id'),
        "patient_id": current_user.get('patient_id')
    }


# ============================================
# TOKEN REFRESH ENDPOINT
# ============================================

@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh JWT access token
    """
    print("\n" + "="*80)
    print("🔍 [AUTH] refresh_token() called")
    print(f"👤 User: {current_user.get('email')}")
    print("="*80 + "\n")
    
    token_data = {
        "sub": current_user['user_id'],
        "email": current_user['email'],
        "user_type": current_user['user_type'],
        "role": current_user.get('role'),
        "branch_id": current_user.get('branch_id')
    }
    
    access_token, expires_at, _ = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Token refreshed for: {current_user['email']}")
    print(f"✅ New token: {access_token[:30]}...")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": expires_at,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# ============================================
# HEALTH CHECK ENDPOINT
# ============================================

@router.get("/health")
async def health_check():
    """
    Check authentication service health
    """
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
            return {
                "status": "healthy",
                "service": "authentication",
                "database": "connected",
                "jwt_enabled": True,
                "auth_method": "email",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "authentication",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )