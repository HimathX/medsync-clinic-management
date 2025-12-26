from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, validator
from core.password_utils import hash_password, verify_password
import logging
import mysql.connector
from typing import Optional
from datetime import datetime
from core.database import get_db

router = APIRouter(tags=["authentication"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, max_length=100, description="User password")
    
    @validator('email')
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        return v.lower().strip()
    
    @validator('password')
    def validate_password(cls, v):
        if not v or not v.strip():
            raise ValueError('Password cannot be empty')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v) > 100:
            raise ValueError('Password is too long')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "johndoe@gmail.com",
                "password": "admin1234"
            }
        }


class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    user_type: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Login successful",
                "user_id": "296351fe-aad4-11f0-afdd-005056c00001",
                "user_type": "patient",
                "full_name": "John Doe",
                "email": "johndoe@gmail.com"
            }
        }


class ErrorResponse(BaseModel):
    success: bool = False
    error_code: str
    message: str
    details: Optional[str] = None
    timestamp: str




@router.post("/login", status_code=status.HTTP_200_OK, response_model=LoginResponse)
def login(credentials: LoginRequest):
    """
    Authenticate user and return user details
    
    - **email**: User's email address (required)
    - **password**: User's password (required, min 6 characters)
    
    Returns:
    - User ID
    - User type (patient, doctor, staff)
    - Full name
    - Email
    
    Errors:
    - **400**: Invalid input (validation error)
    - **401**: Invalid credentials
    - **404**: User not found
    - **500**: Server/database error
    - **503**: Database connection error
    """
    cursor = None
    connection = None
    
    try:
        # Log login attempt (without password)
        logger.info(f"Login attempt for email: {credentials.email}")
        
        # Validate and hash password
        try:
            password_hash = hash_password(credentials.password)
            logger.debug(f"Password hashed successfully, length: {len(password_hash)}")
        except ValueError as e:
            logger.error(f"Password hashing failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password validation failed"
            )
        except Exception as e:
            logger.error(f"Unexpected error during password hashing: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process password"
            )
        
        # Get database connection
        try:
            with get_db() as (cursor, connection):
                # Verify database connection
                if not cursor or not connection:
                    logger.error("Failed to establish database connection")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Database service unavailable"
                    )
                
                # Check if user exists before authentication
                try:
                    cursor.execute(
                        "SELECT COUNT(*) as count FROM user WHERE LOWER(TRIM(email)) = %s",
                        (credentials.email,)
                    )
                    user_exists = cursor.fetchone()
                    
                    if not user_exists or user_exists['count'] == 0:
                        logger.warning(f"Login attempt for non-existent user: {credentials.email}")
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password"
                        )
                except mysql.connector.Error as db_err:
                    logger.error(f"Database error checking user existence: {str(db_err)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Database query failed"
                    )
                
                # Call authentication stored procedure
                try:
                    logger.info("Calling AuthenticateUser procedure")
                    
                    # Set session variables
                    cursor.execute("SET @p_user_id = NULL")
                    cursor.execute("SET @p_user_type = NULL")
                    cursor.execute("SET @p_full_name = NULL")
                    cursor.execute("SET @p_error_message = NULL")
                    cursor.execute("SET @p_success = NULL")
                    
                    # Call stored procedure
                    call_sql = """
                        CALL AuthenticateUser(
                            %s, %s,
                            @p_user_id, @p_user_type, @p_full_name,
                            @p_error_message, @p_success
                        )
                    """
                    cursor.execute(call_sql, (credentials.email, password_hash))
                    
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
                    
                except mysql.connector.Error as db_err:
                    logger.error(f"Database error during authentication: {db_err.msg if hasattr(db_err, 'msg') else str(db_err)}")
                    
                    if db_err.errno == 1305:  # PROCEDURE does not exist
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Authentication service not configured properly"
                        )
                    elif db_err.errno == 2006:  # MySQL server has gone away
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Database connection lost"
                        )
                    elif db_err.errno == 1213:  # Deadlock
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Database is busy, please try again"
                        )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Authentication failed: {str(db_err)}"
                        )
                
                # Validate procedure result
                if not result:
                    logger.error("No result returned from AuthenticateUser procedure")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Authentication service returned no result"
                    )
                
                # Extract result values
                user_id = result.get('user_id')
                user_type = result.get('user_type')
                full_name = result.get('full_name')
                success = result.get('success')
                error_message = result.get('error_message')
                
                # Log authentication result
                logger.info(
                    f"Auth result - email={credentials.email}, "
                    f"success={success}, user_id={user_id}, user_type={user_type}"
                )
                
                # Check authentication success
                if not success or success == 0:
                    logger.warning(f"Authentication failed for {credentials.email}: {error_message}")
                    
                    # Provide specific error messages
                    if error_message:
                        if "password" in error_message.lower():
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Invalid email or password"
                            )
                        elif "not properly configured" in error_message.lower():
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="User account configuration error"
                            )
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=error_message
                            )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password"
                        )
                
                # Validate returned data
                if not user_id:
                    logger.error("Authentication succeeded but no user_id returned")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Authentication service error: Missing user ID"
                    )
                
                if not user_type:
                    logger.error(f"Authentication succeeded but no user_type returned for {user_id}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Authentication service error: Missing user type"
                    )
                
                if not full_name:
                    logger.warning(f"No full_name returned for user {user_id}")
                    full_name = "Unknown User"
                
                # Successful authentication
                logger.info(f"✅ Login successful for {credentials.email} (type: {user_type}, id: {user_id})")
                
                return LoginResponse(
                    success=True,
                    message="Login successful",
                    user_id=user_id,
                    user_type=user_type,
                    full_name=full_name,
                    email=credentials.email
                )
                
        except mysql.connector.Error as db_err:
            logger.error(f"Database connection error: {str(db_err)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failed"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions (already logged)
        raise
        
    except ValueError as ve:
        # Validation errors
        logger.error(f"Validation error during login: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(ve)}"
        )
        
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error during login for {credentials.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication"
        )
    
    finally:
        # Cleanup (if needed)
        logger.debug("Login attempt completed")


@router.get("/verify/{user_id}", status_code=status.HTTP_200_OK)
def verify_user(user_id: str):
    """
    Verify if user exists and get their details
    
    - **user_id**: UUID of the user to verify
    
    Returns:
    - User details if found
    
    Errors:
    - **400**: Invalid user ID format
    - **404**: User not found
    - **500**: Server error
    """
    try:
        # Validate UUID format
        import uuid
        try:
            uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user ID format: {user_id}"
            )
        
        with get_db() as (cursor, connection):
            cursor.execute(
                """SELECT user_id, email, full_name, role as user_type, 
                          created_at, updated_at 
                   FROM user 
                   WHERE user_id = %s""",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with ID {user_id} not found"
                )
            
            return {
                "success": True,
                "user": user,
                "exists": True
            }
            
    except HTTPException:
        raise
    except mysql.connector.Error as db_err:
        logger.error(f"Database error verifying user {user_id}: {str(db_err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during user verification"
        )
    except Exception as e:
        logger.error(f"Error verifying user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify user"
        )


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Check if authentication service is healthy
    
    Returns service status and database connectivity
    """
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
            return {
                "status": "healthy",
                "service": "authentication",
                "database": "connected",
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


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout():
    """
    Logout user (placeholder for future session management)
    
    Currently just returns success as sessions are handled client-side
    """
    return {
        "success": True,
        "message": "Logged out successfully"
    }