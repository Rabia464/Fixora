import uuid
import pytest
from httpx import AsyncClient

from app.main import app
from app.api.dependencies import get_current_student, get_current_user
from app.domain.enums.role import UserRole
from app.services.complaint import complaint_service
from app.domain.schemas.complaint import ComplaintResponse
from app.db.models.role import Role

# Mock dependencies
class MockUser:
    id = uuid.uuid4()
    email = "student@giki.edu.pk"
    hostel = "Hostel A"
    class MockRole:
        name = UserRole.STUDENT.value
    role = MockRole()

async def override_get_current_student():
    return MockUser()

async def override_get_current_user():
    return MockUser()

app.dependency_overrides[get_current_student] = override_get_current_student
app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.mark.asyncio
async def test_create_complaint(client: AsyncClient, monkeypatch):
    mock_complaint_id = uuid.uuid4()
    
    # Mock the service layer
    async def mock_create(db, data, user_id):
        # Return a ComplaintResponse model as the service would
        return ComplaintResponse(
            id=mock_complaint_id,
            title=data.title,
            description=data.description,
            location=data.location,
            status="Open",
            ai_category="Plumbing",
            ai_priority="High",
            ai_department="Maintenance",
            created_at="2026-01-01T00:00:00Z"
        )
        
    monkeypatch.setattr(complaint_service, "create_complaint", mock_create)
    
    payload = {
        "title": "Water leak",
        "description": "Leaking pipe",
        "location": "Room 101"
    }
    
    response = await client.post("/api/v1/complaints", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == str(mock_complaint_id)
    assert data["title"] == "Water leak"

@pytest.mark.asyncio
async def test_get_complaint_not_found(client: AsyncClient, monkeypatch):
    from app.core.exceptions import NotFoundException
    
    async def mock_get(*args, **kwargs):
        raise NotFoundException("Complaint", "123")
        
    monkeypatch.setattr(complaint_service, "get_complaint", mock_get)
    
    test_id = uuid.uuid4()
    response = await client.get(f"/api/v1/complaints/{test_id}")
    
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == 404
    assert "not found" in data["message"]
