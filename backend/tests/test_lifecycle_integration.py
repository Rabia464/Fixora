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
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.db.models  # noqa: F401  (register model metadata)
from app.db.models import Role, User
from app.db.session import Base, get_db
from app.domain.enums import UserRole
from app.main import app


@pytest_asyncio.fixture
async def integration_client(tmp_path):
    db_url = f"sqlite+aiosqlite:///{tmp_path / 'lifecycle.db'}"
    engine = create_async_engine(db_url)
    TestSession = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed the three demo roles and one user per role.
    async with TestSession() as session:
        roles = {
            role: Role(name=role.value)
            for role in (
                UserRole.STUDENT,
                UserRole.HOSTEL_SUPERVISOR,
                UserRole.MAINTENANCE_OFFICE,
            )
        }
        session.add_all(roles.values())
        await session.flush()
        session.add_all(
            [
                User(
                    email="student@giki.edu.pk",
                    full_name="Demo Student",
                    hostel="Hostel A",
                    role_id=roles[UserRole.STUDENT].id,
                ),
                User(
                    email="supervisor@giki.edu.pk",
                    full_name="Demo Supervisor",
                    hostel="Hostel A",
                    role_id=roles[UserRole.HOSTEL_SUPERVISOR].id,
                ),
                User(
                    email="maintenance@giki.edu.pk",
                    full_name="Demo Maintenance",
                    hostel=None,
                    role_id=roles[UserRole.MAINTENANCE_OFFICE].id,
                ),
            ]
        )
        await session.commit()

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


async def _login(client: AsyncClient, email: str) -> dict[str, str]:
    response = await client.post("/api/v1/auth/login", json={"email": email})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.mark.asyncio
async def test_full_complaint_lifecycle(integration_client: AsyncClient):
    client = integration_client
    student = await _login(client, "student@giki.edu.pk")
    supervisor = await _login(client, "supervisor@giki.edu.pk")
    maintenance = await _login(client, "maintenance@giki.edu.pk")

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
async def test_reopen_resolved_complaint(integration_client: AsyncClient):
    client = integration_client
    student = await _login(client, "student@giki.edu.pk")
    supervisor = await _login(client, "supervisor@giki.edu.pk")
    maintenance = await _login(client, "maintenance@giki.edu.pk")

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
