import uuid
import pytest
from httpx import AsyncClient

from app.db.repositories.user import user_repo
from app.db.models.role import Role
from app.db.models.user import User
from app.domain.enums.role import UserRole
from app.api.dependencies import get_current_user
from app.main import app

from datetime import datetime, timezone

class MockUser:
    def __init__(self, email="student@giki.edu.pk", role_name=UserRole.STUDENT.value):
        self.id = uuid.uuid4()
        self.email = email
        self.full_name = "Test User"
        self.hostel = "Hostel A"
        self.role_id = uuid.uuid4()
        self.role = Role(name=role_name)
        now = datetime.now(timezone.utc)
        self.created_at = now
        self.updated_at = now

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, monkeypatch):
    mock_user = MockUser(email="student@giki.edu.pk", role_name=UserRole.STUDENT.value)

    async def mock_get_by_email(db, email):
        return mock_user

    monkeypatch.setattr(user_repo, "get_by_email", mock_get_by_email)

    response = await client.post("/api/v1/auth/login", json={"email": "student@giki.edu.pk"})

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert data["role"] == "Student"

@pytest.mark.asyncio
async def test_login_unauthorized(client: AsyncClient, monkeypatch):
    async def mock_get_by_email_none(db, email):
        return None

    monkeypatch.setattr(user_repo, "get_by_email", mock_get_by_email_none)

    response = await client.post("/api/v1/auth/login", json={"email": "unknown@giki.edu.pk"})

    assert response.status_code == 401
    data = response.json()
    assert data["code"] == 401
    assert "not registered" in data["message"]

@pytest.mark.asyncio
async def test_login_validation_error(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={"wrong_field": "value"})

    assert response.status_code == 422
    data = response.json()
    assert data["code"] == 422
    assert "Validation Error" in data["message"]

@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient):
    mock_user = MockUser(email="student@giki.edu.pk", role_name=UserRole.STUDENT.value)

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    try:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "student@giki.edu.pk"
        assert data["full_name"] == "Test User"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
