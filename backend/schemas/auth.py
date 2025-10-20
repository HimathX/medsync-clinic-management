from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """Match database user_session.user_role ENUM exactly"""
    ADMIN = "admin"
    MANAGER = "manager"
    DOCTOR = "doctor"
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    PHARMACIST = "pharmacist"
    PATIENT = "patient"


class UserType(str, Enum):
    """Match database user.user_type ENUM"""
    EMPLOYEE = "employee"
    PATIENT = "patient"


# ============================================
# LOGIN REQUEST/RESPONSE MODELS
# ============================================

class LoginRequest(BaseModel):
    """
    Login request model for JSON-based authentication
    """
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "doctor@medsync.com",
                "password": "securepassword123"
            }
        }


class LoginResponse(BaseModel):
    """
    Login response with JWT token and user information
    """
    success: bool = True
    message: str = "Login successful"
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_id: str = Field(..., description="User UUID")
    user_type: UserType = Field(..., description="User type (employee/patient)")
    full_name: str = Field(..., description="User's full name")
    email: EmailStr = Field(..., description="User's email")
    role: Optional[UserRole] = Field(None, description="Employee role (if applicable)")
    branch_id: Optional[str] = Field(None, description="Branch ID (if applicable)")
    expires_at: datetime = Field(..., description="Token expiration timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Login successful",
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_type": "employee",
                "full_name": "Dr. John Smith",
                "email": "john.smith@medsync.com",
                "role": "doctor",
                "branch_id": "branch-uuid-here",
                "expires_at": "2025-10-20T12:00:00"
            }
        }


class TokenData(BaseModel):
    """
    JWT token payload data
    """
    user_id: str
    email: EmailStr
    user_type: UserType
    role: Optional[UserRole] = None
    branch_id: Optional[str] = None
    session_id: str
    exp: datetime
    iat: datetime


class TokenResponse(BaseModel):
    """
    OAuth2-compliant token response
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Seconds until token expires")


class RefreshTokenRequest(BaseModel):
    """
    Request to refresh an access token
    """
    refresh_token: Optional[str] = Field(None, description="Refresh token (if implemented)")


class UserSession(BaseModel):
    """
    User session information
    """
    session_id: str
    user_id: str
    user_role: UserRole
    branch_id: Optional[str] = None
    login_time: datetime
    last_activity: datetime
    ip_address: str
    user_agent: str
    is_active: bool = True


class FailedLoginReason(str, Enum):
    """
    Reasons for failed login attempts
    """
    INVALID_EMAIL = "INVALID_EMAIL"
    INVALID_PASSWORD = "INVALID_PASSWORD"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_DISABLED = "ACCOUNT_DISABLED"
    SESSION_LIMIT_EXCEEDED = "SESSION_LIMIT_EXCEEDED"
    IP_BLOCKED = "IP_BLOCKED"


class LogoutRequest(BaseModel):
    """
    Logout request (can be empty as session_id comes from token)
    """
    pass


class LogoutResponse(BaseModel):
    """
    Logout response
    """
    success: bool = True
    message: str = "Logged out successfully"