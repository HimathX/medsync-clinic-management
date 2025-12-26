"""
Password Hashing Utilities
Centralized password hashing and verification functions

Note: This module maintains backward compatibility with the existing
SHA-256 hashing used throughout the system. For new projects, consider
using bcrypt, scrypt, or Argon2 for better security against brute force attacks.
"""
import hashlib
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """
    Hash password using SHA-256
    
    Note: SHA-256 is used for backward compatibility with existing system.
    For new implementations, consider using bcrypt or Argon2.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hexadecimal hash of the password
        
    Example:
        >>> hash_password("mypassword123")
        '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
    """
    if not password:
        raise ValueError("Password cannot be empty")
    
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Previously hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
        
    Example:
        >>> hashed = hash_password("mypassword123")
        >>> verify_password("mypassword123", hashed)
        True
        >>> verify_password("wrongpassword", hashed)
        False
    """
    if not plain_password or not hashed_password:
        return False
    
    return hash_password(plain_password) == hashed_password


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password meets minimum security requirements
    
    Requirements:
    - At least 8 characters
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
        
    Example:
        >>> validate_password_strength("weak")
        (False, "Password must be at least 8 characters long")
        >>> validate_password_strength("StrongPass123")
        (True, "Password is strong")
    """
    if not password:
        return False, "Password cannot be empty"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    return True, "Password is strong"
