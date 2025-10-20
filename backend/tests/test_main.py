import pytest
from fastapi import status

def test_app_exists():
    """Test that the FastAPI app is created"""
    from main import app
    assert app is not None
    assert app.title is not None

def test_root_endpoint(client):
    """Test the root endpoint if it exists"""
    response = client.get("/")
    assert response.status_code in [
        status.HTTP_200_OK,
        status.HTTP_404_NOT_FOUND,
        status.HTTP_307_TEMPORARY_REDIRECT
    ]

def test_docs_endpoint(client):
    """Test that API docs are accessible"""
    response = client.get("/docs")
    assert response.status_code == status.HTTP_200_OK

def test_openapi_endpoint(client):
    """Test that OpenAPI schema is accessible"""
    response = client.get("/openapi.json")
    assert response.status_code == status.HTTP_200_OK
    assert "openapi" in response.json()