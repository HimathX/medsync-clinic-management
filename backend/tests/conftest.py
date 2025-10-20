import pytest
from fastapi.testclient import TestClient
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

@pytest.fixture(scope="function")
def client():
    """Create test client"""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="session")
def test_user_data():
    """Sample test user data"""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "username": "testuser"
    }

@pytest.fixture(scope="session")
def db_config():
    """Database configuration from environment"""
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "user": os.getenv("DB_USER", "medsync_user"),
        "password": os.getenv("DB_PASSWORD", "medsync_password"),
        "database": os.getenv("DB_NAME", "medsync_db"),
        "port": int(os.getenv("DB_PORT", "3306"))
    }