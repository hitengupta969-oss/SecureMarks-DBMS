import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings
from app.core.database import get_db_connection

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="session")
def admin_token(client):
    res = client.post("/api/auth/login", json={"email": "admin@securemarks.edu", "password": "Admin@123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]

@pytest.fixture(scope="session")
def faculty_token(client):
    res = client.post("/api/auth/login", json={"email": "faculty.sharma@securemarks.edu", "password": "Faculty@123"})
    assert res.status_code == 200, f"Faculty login failed: {res.text}"
    return res.json()["access_token"]

@pytest.fixture(scope="session")
def student_token(client):
    res = client.post("/api/auth/login", json={"email": "aarav.patel@student.securemarks.edu", "password": "Student@123"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    return res.json()["access_token"]
