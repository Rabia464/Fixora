import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from app.api.dependencies import (
    get_current_maintenance,
    get_current_student,
    get_current_supervisor,
    get_current_user,
)
from app.core.exceptions import NotFoundException
from app.domain.enums import ComplaintPriority, ComplaintStatus, UserRole
from app.domain.schemas.complaint import ComplaintResponse
from app.main import app
from app.services.complaint import complaint_service


class MockUser:
    def __init__(self, role_name=UserRole.STUDENT.value, email="student@giki.edu.pk"):
        self.id = uuid.uuid4()
        self.email = email
        self.full_name = "Test User"
        self.hostel = "Hostel A"

        class MockRole:
            name = role_name

        self.role = MockRole()


def make_mock_complaint_response(
    complaint_id=None,
    title="Water leak",
    status=ComplaintStatus.OPEN,
    created_by=None,
    supervisor_id=None,
    override=False,
):
    now = datetime.now(timezone.utc)
    return ComplaintResponse(
        id=complaint_id or uuid.uuid4(),
        title=title,
        description="Leaking pipe in washroom",
        location="Room 101",
        hostel="Hostel A",
        status=status,
        ai_category="Plumbing",
        ai_priority=ComplaintPriority.HIGH,
        ai_department="Maintenance",
        supervisor_override=override,
        overridden_category="Plumbing" if override else None,
        overridden_priority=ComplaintPriority.CRITICAL if override else None,
        overridden_department="Maintenance" if override else None,
        created_by=created_by or uuid.uuid4(),
        supervisor_id=supervisor_id or uuid.uuid4(),
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_create_complaint(client: AsyncClient, monkeypatch):
    mock_student = MockUser(role_name=UserRole.STUDENT.value)
    mock_id = uuid.uuid4()

    app.dependency_overrides[get_current_student] = lambda: mock_student
    app.dependency_overrides[get_current_user] = lambda: mock_student

    async def mock_create(db, data, user_id):
        return make_mock_complaint_response(
            complaint_id=mock_id,
            title=data.title,
            created_by=user_id,
        )

    monkeypatch.setattr(complaint_service, "create_complaint", mock_create)

    try:
        payload = {
            "title": "Water leak in washroom",
            "description": "Pipe is leaking heavily under the sink",
            "location": "Room 101",
        }
        response = await client.post("/api/v1/complaints", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == str(mock_id)
        assert data["title"] == "Water leak in washroom"
        assert data["status"] == "Open"
    finally:
        app.dependency_overrides.pop(get_current_student, None)
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_get_complaint_not_found(client: AsyncClient, monkeypatch):
    mock_student = MockUser(role_name=UserRole.STUDENT.value)
    app.dependency_overrides[get_current_user] = lambda: mock_student

    async def mock_get(*args, **kwargs):
        raise NotFoundException("Complaint", "123")

    monkeypatch.setattr(complaint_service, "get_complaint", mock_get)

    try:
        test_id = uuid.uuid4()
        response = await client.get(f"/api/v1/complaints/{test_id}")
        assert response.status_code == 404
        data = response.json()
        assert data["code"] == 404
        assert "not found" in data["message"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_supervisor_review(client: AsyncClient, monkeypatch):
    mock_supervisor = MockUser(role_name=UserRole.HOSTEL_SUPERVISOR.value)
    app.dependency_overrides[get_current_supervisor] = lambda: mock_supervisor

    async def mock_review(db, comp_id, user_id, review_data):
        return make_mock_complaint_response(
            complaint_id=comp_id,
            status=ComplaintStatus.UNDER_REVIEW,
            override=True,
        )

    monkeypatch.setattr(complaint_service, "supervisor_review", mock_review)

    try:
        comp_id = uuid.uuid4()
        payload = {
            "category": "Plumbing",
            "priority": "Critical",
            "department": "Maintenance",
            "override": True,
        }
        response = await client.patch(f"/api/v1/complaints/{comp_id}/review", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "UnderReview"
        assert data["supervisor_override"] is True
    finally:
        app.dependency_overrides.pop(get_current_supervisor, None)


@pytest.mark.asyncio
async def test_forward_to_maintenance(client: AsyncClient, monkeypatch):
    mock_supervisor = MockUser(role_name=UserRole.HOSTEL_SUPERVISOR.value)
    app.dependency_overrides[get_current_supervisor] = lambda: mock_supervisor

    async def mock_forward(db, comp_id, user_id):
        return make_mock_complaint_response(complaint_id=comp_id, status=ComplaintStatus.FORWARDED)

    monkeypatch.setattr(complaint_service, "forward_to_maintenance", mock_forward)

    try:
        comp_id = uuid.uuid4()
        response = await client.patch(f"/api/v1/complaints/{comp_id}/forward")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Forwarded"
    finally:
        app.dependency_overrides.pop(get_current_supervisor, None)


@pytest.mark.asyncio
async def test_maintenance_resolve(client: AsyncClient, monkeypatch):
    mock_maint = MockUser(role_name=UserRole.MAINTENANCE_OFFICE.value)
    app.dependency_overrides[get_current_maintenance] = lambda: mock_maint

    async def mock_resolve(db, comp_id, user_id, data):
        return make_mock_complaint_response(complaint_id=comp_id, status=ComplaintStatus.RESOLVED)

    monkeypatch.setattr(complaint_service, "resolve_complaint", mock_resolve)

    try:
        comp_id = uuid.uuid4()
        payload = {"resolution_note": "Replaced the valve washer and sealed pipes"}
        response = await client.patch(f"/api/v1/complaints/{comp_id}/resolve", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Resolved"
    finally:
        app.dependency_overrides.pop(get_current_maintenance, None)


@pytest.mark.asyncio
async def test_student_confirm(client: AsyncClient, monkeypatch):
    mock_student = MockUser(role_name=UserRole.STUDENT.value)
    app.dependency_overrides[get_current_student] = lambda: mock_student

    async def mock_confirm(db, comp_id, user_id):
        return make_mock_complaint_response(complaint_id=comp_id, status=ComplaintStatus.CLOSED)

    monkeypatch.setattr(complaint_service, "confirm_resolution", mock_confirm)

    try:
        comp_id = uuid.uuid4()
        response = await client.patch(f"/api/v1/complaints/{comp_id}/confirm")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Closed"
    finally:
        app.dependency_overrides.pop(get_current_student, None)
