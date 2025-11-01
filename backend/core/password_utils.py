"""
Password Hashing Utilities
Centralized password hashing and verification functions
"""
import hashlib
import logging

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """
    Hash password using SHA-256
    
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


def validate_password_strength(password: str) -> tuple[bool, str]:
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
        tuple: (is_valid: bool, message: str)
        
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


# For backward compatibility
def hash_password_legacy(password: str) -> str:
    """
    Legacy password hashing function (same as hash_password)
    Kept for backward compatibility with existing code
    """
    return hash_password(password)
