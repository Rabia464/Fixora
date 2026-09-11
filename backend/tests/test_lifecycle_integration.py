"""
End-to-end integration test for the complaint lifecycle.

Unlike the other suites (which mock the service/repository layer), this test
drives the real service + repository + ORM against a throwaway SQLite database.
It exercises the code paths that unit mocks skip and guards against two classes
of regression that mocks cannot catch:

* enum columns must round-trip as their Python enum (so ``status.value`` works
  when a complaint is re-read from the DB during a transition), and
* timestamps must not trigger a post-commit lazy refresh (which would raise
  MissingGreenlet when the response is serialized under the async engine).
"""

import pytest
from httpx import AsyncClient

# integration_client and auth_headers fixtures live in conftest.py.


@pytest.mark.asyncio
async def test_full_complaint_lifecycle(integration_client: AsyncClient, auth_headers):
    client = integration_client
    student = await auth_headers("student@giki.edu.pk")
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    maintenance = await auth_headers("maintenance@giki.edu.pk")

    # 1. Student creates a complaint; AI triage classifies it.
    response = await client.post(
        "/api/v1/complaints",
        headers=student,
        json={
            "title": "Sparking wall socket",
            "description": "Wall socket sparks, a clear fire hazard emergency.",
            "location": "Room 401",
        },
    )
    assert response.status_code == 201, response.text
    complaint = response.json()
    complaint_id = complaint["id"]
    assert complaint["status"] == "Open"
    assert complaint["ai_category"] == "Electrical"
    assert complaint["ai_priority"] == "Critical"

    # 2-6. Walk the complaint through the full lifecycle.
    transitions = [
        (
            "patch",
            f"/api/v1/complaints/{complaint_id}/review",
            supervisor,
            {
                "category": "Electrical",
                "priority": "Critical",
                "department": "Electrical",
                "override": False,
            },
            "UnderReview",
        ),
        ("patch", f"/api/v1/complaints/{complaint_id}/forward", supervisor, None, "Forwarded"),
        (
            "patch",
            f"/api/v1/complaints/{complaint_id}/progress",
            maintenance,
            {"note": "Technician on site"},
            "InProgress",
        ),
        (
            "patch",
            f"/api/v1/complaints/{complaint_id}/resolve",
            maintenance,
            {"resolution_note": "Replaced the faulty socket"},
            "Resolved",
        ),
        ("patch", f"/api/v1/complaints/{complaint_id}/confirm", student, None, "Closed"),
    ]
    for _method, url, headers, body, expected_status in transitions:
        response = await client.patch(url, headers=headers, json=body)
        assert response.status_code == 200, f"{url} -> {response.status_code}: {response.text}"
        assert response.json()["status"] == expected_status

    # 7. The immutable audit trail records every step in order.
    response = await client.get(f"/api/v1/complaints/{complaint_id}/audit_logs", headers=student)
    assert response.status_code == 200, response.text
    actions = [entry["action"] for entry in response.json()]
    assert actions == [
        "TicketCreated",
        "SupervisorReviewed",
        "ForwardedToMaintenance",
        "StatusUpdated",
        "StatusUpdated",
        "StudentConfirmed",
    ]


@pytest.mark.asyncio
async def test_reopen_resolved_complaint(integration_client: AsyncClient, auth_headers):
    client = integration_client
    student = await auth_headers("student@giki.edu.pk")
    supervisor = await auth_headers("supervisor@giki.edu.pk")
    maintenance = await auth_headers("maintenance@giki.edu.pk")

    create = await client.post(
        "/api/v1/complaints",
        headers=student,
        json={
            "title": "Leaking washroom pipe",
            "description": "Continuous water leak flooding the washroom floor.",
            "location": "Room 210",
        },
    )
    complaint_id = create.json()["id"]

    await client.patch(
        f"/api/v1/complaints/{complaint_id}/review",
        headers=supervisor,
        json={
            "category": "Plumbing",
            "priority": "High",
            "department": "Plumbing",
            "override": False,
        },
    )
    await client.patch(f"/api/v1/complaints/{complaint_id}/forward", headers=supervisor)
    await client.patch(
        f"/api/v1/complaints/{complaint_id}/progress",
        headers=maintenance,
        json={"note": "Investigating"},
    )
    await client.patch(
        f"/api/v1/complaints/{complaint_id}/resolve",
        headers=maintenance,
        json={"resolution_note": "Tightened the joint"},
    )

    # Student is not satisfied and reopens the resolved complaint.
    response = await client.patch(
        f"/api/v1/complaints/{complaint_id}/reopen",
        headers=student,
        json={"reason": "The pipe is still dripping after the repair."},
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "Reopened"
