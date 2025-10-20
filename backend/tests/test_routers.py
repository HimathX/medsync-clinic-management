import pytest
from fastapi import status

def test_patient_router_exists(client):
    """Test that patient router is registered"""
    response = client.get("/openapi.json")
    openapi = response.json()
    paths = openapi.get("paths", {})
    assert any("patient" in path.lower() for path in paths.keys())

def test_doctor_router_exists(client):
    """Test that doctor router is registered"""
    response = client.get("/openapi.json")
    openapi = response.json()
    paths = openapi.get("paths", {})
    assert any("doctor" in path.lower() for path in paths.keys())

def test_appointment_router_exists(client):
    """Test that appointment router is registered"""
    response = client.get("/openapi.json")
    openapi = response.json()
    paths = openapi.get("paths", {})
    assert any("appointment" in path.lower() for path in paths.keys())

def test_branch_router_exists(client):
    """Test that branch router is registered"""
    response = client.get("/openapi.json")
    openapi = response.json()
    paths = openapi.get("paths", {})
    assert any("branch" in path.lower() for path in paths.keys())