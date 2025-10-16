from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from schemas import *
from database import *
from db_utils import get_user_by_email, get_user_by_id, create_session, get_active_session, invalidate_session
from db_utils import get_patient_by_user_id, get_employee_by_user_id, get_doctor_by_user_id
import os
import logging
import mysql.connector


logging.basicConfig(level=logging.DEBUG, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)


SECRET_KEY = os.getenv("SECRET_KEY", "hhm")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    
    current_time = datetime.utcnow()
    
    if expires_delta:
        expire = current_time + expires_delta
    else:
        expire = current_time + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire


def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate user with email and password"""
    try:
        user = get_user_by_email(email.lower().strip())
        if not user or not verify_password(password, user['password_hash']):
            return None
        return user
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return None


def create_user_session(user_id: str, token: str, expires_at: datetime) -> str:
    """Create new user session"""
    try:
        session_id = create_session(user_id, token, expires_at)
        return session_id
    except Exception as e:
        logger.error(f"Session creation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Session creation failed")


def invalidate_user_session(token: str) -> bool:
    """Invalidate user session"""
    try:
        return invalidate_session(token)
    except Exception as e:
        logger.error(f"Session invalidation error: {e}")
        return False


def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        logger.debug(f"Token payload: sub={user_id}, exp={payload.get('exp')}")
        
        if user_id is None:
            logger.error("Token missing 'sub' claim")
            raise credentials_exception
            
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise credentials_exception
    
    try:
        session = get_active_session(token)
        
        if session is None:
            logger.debug(f"Session not found or inactive for token")
            raise credentials_exception
        
        user = get_user_by_id(user_id)
        
        if user is None:
            logger.debug(f"User not found: user_id={user_id}")
            raise credentials_exception
        
        logger.debug(f"User authenticated: user_id={user_id}, email={user['email']}, user_type={user['user_type']}")
        return user
        
    except mysql.connector.Error as e:
        logger.error(f"Database error in authentication: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication service error")
    except Exception as e:
        logger.error(f"Unexpected error in authentication: {e}")
        raise credentials_exception


def get_current_employee(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current authenticated employee with role information"""
    user = get_current_user(token)
    if user['user_type'] != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access required")
    
    try:
        employee = get_employee_by_user_id(user['user_id'])
        if employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")
        
        user.update(employee)
        return user
        
    except mysql.connector.Error as e:
        logger.error(f"Database error getting employee: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Employee service error")


def get_current_patient(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current authenticated patient"""
    user = get_current_user(token)
    if user['user_type'] != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")
    
    try:
        patient = get_patient_by_user_id(user['user_id'])
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient record not found")
        
        user.update(patient)
        return user
        
    except mysql.connector.Error as e:
        logger.error(f"Database error getting patient: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Patient service error")


def get_current_doctor(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current authenticated doctor"""
    user = get_current_employee(token)
    
    if user['role'] != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    
    try:
        doctor = get_doctor_by_user_id(user['user_id'])
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor record not found")
        
        user.update(doctor)
        return user
        
    except mysql.connector.Error as e:
        logger.error(f"Database error getting doctor: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Doctor service error")


def require_role(required_roles: list):
    """Decorator to require specific employee roles"""
    def role_checker(user: Dict[str, Any] = Depends(get_current_employee)):
        if user['role'] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Access denied. Required roles: {', '.join(required_roles)}"
            )
        return user
    return role_checker
