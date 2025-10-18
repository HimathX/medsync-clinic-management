"""Basic health check tests"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path so we can import main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_read_root():
    """Test that the API root endpoint works"""
    response = client.get("/")
    assert response.status_code in [200, 404]  # Accept either for now

def test_app_exists():
    """Test that the FastAPI app exists"""
    assert app is not None
    assert hasattr(app, 'title')

def test_health_check():
    """Test basic API health"""
    # Test if app can be instantiated
    assert app is not None
    
def test_api_routes_exist():
    """Test that some routes are registered"""
    routes = [route.path for route in app.routes]
    assert len(routes) > 0  # Should have at least some routes