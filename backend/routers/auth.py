from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import hashlib
from core.database import get_db

router = APIRouter(tags=["authentication"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: str = None
    user_type: str = None
    full_name: str = None

@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    try:
        password_hash = hash_password(credentials.password)
        
        result = db.execute(
            text("""
                CALL AuthenticateUser(
                    :p_email,
                    :p_password_hash,
                    @p_user_id,
                    @p_user_type,
                    @p_error_message,
                    @p_success
                )
            """),
            {
                "p_email": credentials.email.lower(),
                "p_password_hash": password_hash
            }
        )
        
        output = db.execute(text("SELECT @p_user_id, @p_user_type, @p_error_message, @p_success")).fetchone()
        
        user_id = output[0]
        user_type = output[1]
        error_message = output[2]
        success = bool(output[3])
        
        if success:
            # Get user details
            user = db.execute(
                text("SELECT full_name FROM user WHERE user_id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            return LoginResponse(
                success=True,
                message="Login successful",
                user_id=user_id,
                user_type=user_type,
                full_name=user[0] if user else None
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_message or "Invalid credentials"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )