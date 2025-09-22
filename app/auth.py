from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional
from . import models, schemas, database
import os
import logging
logging.basicConfig(level=logging.DEBUG)
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
        to_encode["sub"] = str(to_encode["sub"])  # Convert sub to string
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    print('hi')
    return user

def create_session(db: Session, user_id: int, token: str,created_at: datetime, expires_at: datetime):
    db_session = models.Session(user_id=user_id, token=token, created_at=created_at, expires_at=expires_at)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def invalidate_session(db: Session, token: str):
    db_session = db.query(models.Session).filter(models.Session.token == token, models.Session.is_active == True).first()
    if db_session:
        db_session.is_active = False
        db.commit()
        db.refresh(db_session)
    return db_session

def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.debug(f"Decoding token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        logger.debug(f"Token payload: sub={user_id}, exp={payload.get('exp')}")
        if user_id is None:
            logger.error("Token missing 'sub' claim")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise credentials_exception
    logger.debug(f"Checking session for token: {token[:10]}...")
    session = db.query(models.Session).filter(models.Session.token == token, models.Session.is_active == True).first()
    if session is None:
        logger.error("Session not found or inactive")
        raise credentials_exception
    if session.expires_at < datetime.utcnow():
        logger.error(f"Session expired: expires_at={session.expires_at}")
        raise credentials_exception
    logger.debug(f"Fetching user: user_id={user_id}")
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user is None:
        logger.error(f"User not found: user_id={user_id}")
        raise credentials_exception
    logger.debug(f"User authenticated: user_id={user_id}, email={user.email}, user_type={user.user_type}")
    return user

def get_current_employee(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    user = get_current_user(db, token)
    if user.user_type != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access required")
    return user

def get_current_patient(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    user = get_current_user(db, token)
    if user.user_type != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")
    return user