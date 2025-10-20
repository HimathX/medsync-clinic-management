import pytest

def test_imports_work():
    """Test that basic imports work"""
    try:
        from fastapi import FastAPI
        from pydantic import BaseModel
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import required modules: {e}")

def test_password_hashing_module_exists():
    """Test that password hashing utilities exist"""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "TestPassword123!"
        hashed = pwd_context.hash(password)
        
        assert hashed != password
        assert pwd_context.verify(password, hashed) is True
        assert pwd_context.verify("WrongPassword", hashed) is False
    except ImportError:
        pytest.skip("passlib not installed")

def test_jwt_module_exists():
    """Test that JWT utilities are available"""
    try:
        from jose import jwt
        import os
        
        secret_key = os.getenv("SECRET_KEY", "test_secret")
        algorithm = os.getenv("ALGORITHM", "HS256")
        
        data = {"sub": "test@example.com"}
        token = jwt.encode(data, secret_key, algorithm=algorithm)
        
        assert token is not None
        decoded = jwt.decode(token, secret_key, algorithms=[algorithm])
        assert decoded["sub"] == "test@example.com"
    except ImportError:
        pytest.skip("python-jose not installed")