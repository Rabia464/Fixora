import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock

from app.services.auth import auth_service
from app.core.exceptions import UnauthorizedException
from app.db.models.user import User

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, monkeypatch):
    mock_token = "mock_jwt_token"
    
    # Mock the auth service to bypass DB
    async def mock_authenticate(db, email):
        return mock_token
        
    monkeypatch.setattr(auth_service, "authenticate_user", mock_authenticate)
    
    response = await client.post("/api/v1/auth/login", json={"email": "student@giki.edu.pk"})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] == mock_token

@pytest.mark.asyncio
async def test_login_unauthorized(client: AsyncClient, monkeypatch):
    # Mock throwing BusinessLogicException
    async def mock_authenticate_fail(db, email):
        raise UnauthorizedException("Invalid credentials")
        
    monkeypatch.setattr(auth_service, "authenticate_user", mock_authenticate_fail)
    
    response = await client.post("/api/v1/auth/login", json={"email": "unknown@giki.edu.pk"})
    
    assert response.status_code == 401
    data = response.json()
    # Verify our custom exception handler format
    assert data["code"] == 401
    assert data["message"] == "Invalid credentials"

@pytest.mark.asyncio
async def test_login_validation_error(client: AsyncClient):
    # Send missing email
    response = await client.post("/api/v1/auth/login", json={"wrong_field": "value"})
    
    assert response.status_code == 422
    data = response.json()
    assert data["code"] == 422
    assert "Validation Error" in data["message"]
