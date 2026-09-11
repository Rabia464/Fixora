"""
Integration tests for role-based access control and complaint state-machine
guards, driven against a real SQLite database (see conftest.py fixtures).

These are the core business rules — who may act, on which complaints, and in
which order — and previously had no real-DB coverage because the unit suites
mock the service layer.
"""

import uuid

import pytest
from httpx import AsyncClient


async def _create_open_complaint(client: AsyncClient, student_headers: dict[str, str]) -> str:
    response = await client.post(
        "/api/v1/complaints",
        headers=student_headers,
        json={
            "title": "Broken ceiling fan",
            "description": "The ceiling fan does not spin and makes a noise.",
            "location": "Room 101",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


async def _advance_to(
    client: AsyncClient,
    complaint_id: str,
    target: str,
    *,
    student: dict[str, str],
    supervisor: dict[str, str],
    maintenance: dict[str, str],
) -> None:
    """Move a freshly created complaint forward to the requested status."""
    steps = [
        (
            "UnderReview",
            "patch",
            f"/api/v1/complaints/{complaint_id}/review",
            supervisor,
            {
                "category": "Electrical",
                "priority": "Medium",
                "department": "Electrical",
                "override": False,
            },
        ),
        ("Forwarded", "patch", f"/api/v1/complaints/{complaint_id}/forward", supervisor, None),
        (
            "InProgress",
            "patch",
            f"/api/v1/complaints/{complaint_id}/progress",
            maintenance,
            {"note": "on site"},
        ),
        (
            "Resolved",
            "patch",
            f"/api/v1/complaints/{complaint_id}/resolve",
            maintenance,
            {"resolution_note": "Fixed the fan"},
        ),
    ]
    for status, _method, url, headers, body in steps:
        response = await client.patch(url, headers=headers, json=body)
        assert response.status_code == 200, f"advancing to {status}: {response.text}"
        if status == target:
            return


# --------------------------------------------------------------------------
# Authentication
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_unknown_email_rejected(integration_client: AsyncClient):
    response = await integration_client.post(
        "/api/v1/auth/login", json={"email": "ghost@giki.edu.pk"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_requires_token(integration_client: AsyncClient):
    response = await integration_client.get("/api/v1/complaints")
    assert response.status_code == 401


# --------------------------------------------------------------------------
# Role-based access control
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_non_student_cannot_create_complaint(integration_client: AsyncClient, auth_headers):
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    response = await integration_client.post(
        "/api/v1/complaints",
        headers=supervisor,
        json={
            "title": "Should be forbidden",
            "description": "Supervisors cannot file complaints.",
            "location": "Room 1",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_review(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)
    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/review",
        headers=student,
        json={
            "category": "Electrical",
            "priority": "Low",
            "department": "Electrical",
            "override": False,
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_maintenance_cannot_forward(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    maintenance = await auth_headers("maintenance@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)
    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/forward", headers=maintenance
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_supervisor_cannot_access_other_hostel(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")  # Hostel A
    supervisor_b = await auth_headers("supervisorB@giki.edu.pk")  # Hostel B
    complaint_id = await _create_open_complaint(integration_client, student)

    # Hostel B supervisor may not view a Hostel A complaint...
    view = await integration_client.get(f"/api/v1/complaints/{complaint_id}", headers=supervisor_b)
    assert view.status_code == 403

    # ...nor review it.
    review = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/review",
        headers=supervisor_b,
        json={
            "category": "Electrical",
            "priority": "Low",
            "department": "Electrical",
            "override": False,
        },
    )
    assert review.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_view_others_complaint(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    other_student = await auth_headers("student2@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)

    response = await integration_client.get(
        f"/api/v1/complaints/{complaint_id}", headers=other_student
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_confirm_others_complaint(
    integration_client: AsyncClient, auth_headers
):
    student = await auth_headers("student@giki.edu.pk")
    other_student = await auth_headers("student2@giki.edu.pk")
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    maintenance = await auth_headers("maintenance@giki.edu.pk")

    complaint_id = await _create_open_complaint(integration_client, student)
    await _advance_to(
        integration_client,
        complaint_id,
        "Resolved",
        student=student,
        supervisor=supervisor,
        maintenance=maintenance,
    )

    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/confirm", headers=other_student
    )
    assert response.status_code == 403


# --------------------------------------------------------------------------
# State-machine guards (invalid transitions -> 409 Conflict)
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cannot_forward_before_review(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)

    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/forward", headers=supervisor
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_cannot_start_progress_before_forward(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    maintenance = await auth_headers("maintenance@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)

    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/progress",
        headers=maintenance,
        json={"note": "too early"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_cannot_confirm_before_resolved(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)

    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/confirm", headers=student
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_cannot_review_forwarded_complaint(integration_client: AsyncClient, auth_headers):
    student = await auth_headers("student@giki.edu.pk")
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    maintenance = await auth_headers("maintenance@giki.edu.pk")
    complaint_id = await _create_open_complaint(integration_client, student)
    await _advance_to(
        integration_client,
        complaint_id,
        "Forwarded",
        student=student,
        supervisor=supervisor,
        maintenance=maintenance,
    )

    response = await integration_client.patch(
        f"/api/v1/complaints/{complaint_id}/review",
        headers=supervisor,
        json={
            "category": "Electrical",
            "priority": "High",
            "department": "Electrical",
            "override": True,
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_get_missing_complaint_returns_404(integration_client: AsyncClient, auth_headers):
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    response = await integration_client.get(
        f"/api/v1/complaints/{uuid.uuid4()}", headers=supervisor
    )
    assert response.status_code == 404
