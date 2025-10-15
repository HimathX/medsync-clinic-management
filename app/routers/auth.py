from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from .. import schemas, auth
from typing import Dict, Any
import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, Any]:
    """User login endpoint"""
    try:
        # Authenticate user
        user = auth.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        print(f"🔑 LOGIN: Creating token for user_id={user['user_id']}")
        print(f"🔑 LOGIN: Current time before token creation (UTC): {datetime.utcnow()}")
        access_token, expires_at = auth.create_access_token(data={"sub": user['user_id']})
        print(f"🔑 LOGIN: Token created: {access_token[:20]}..., expires_at={expires_at}")
        print(f"🔑 LOGIN: Token expiry is {expires_at - datetime.utcnow()} from now")
        
        # Create session
        print(f"🔒 LOGIN: Creating session for user_id={user['user_id']}")
        auth.create_user_session(user['user_id'], access_token, expires_at)
        print(f"✅ LOGIN: Session created successfully")
        
        # Update last login
        from ..database import execute_query
        execute_query(
            "UPDATE User SET last_login = %s WHERE user_id = %s",
            (datetime.utcnow(), user['user_id'])
        )
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user_type": user['user_type'],
            "full_name": user['full_name'],
            "email": user['email']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login service error"
        )

@router.post("/logout")
def logout(token: str = Depends(auth.oauth2_scheme)) -> Dict[str, str]:
    """User logout endpoint"""
    try:
        success = auth.invalidate_user_session(token)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Session not found or already inactive"
            )
        
        return {"message": "Logged out successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout service error"
        )

@router.get("/me")
def get_current_user_info(current_user: Dict[str, Any] = Depends(auth.get_current_user)) -> Dict[str, Any]:
    """Get current user information"""
    return {
        "user_id": current_user['user_id'],
        "user_type": current_user['user_type'],
        "full_name": current_user['full_name'],
        "email": current_user['email'],
        "gender": current_user['gender'],
        "created_at": current_user['created_at']
    }

@router.post("/refresh")
def refresh_token(current_user: Dict[str, Any] = Depends(auth.get_current_user)) -> Dict[str, Any]:
    """Refresh access token"""
    try:
        # Create new access token
        access_token, expires_at = auth.create_access_token(data={"sub": current_user['user_id']})
        
        # Create new session (old one will be automatically cleaned up)
        auth.create_user_session(current_user['user_id'], access_token, expires_at)
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh service error"
        )