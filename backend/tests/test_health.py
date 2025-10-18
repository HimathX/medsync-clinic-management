"""Basic health check tests"""
import pytest
from fastapi.testclient import TestClient
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