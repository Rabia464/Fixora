import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.db.models  # noqa: F401  (register model metadata)
from app.db.models import Role, User
from app.db.session import Base, get_db
from app.domain.enums import UserRole
from app.main import app


# This allows async tests to use the same event loop
@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def client():
    """
    Async test client fixture.
    Creates a single test client for the entire test session.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# Demo users seeded for integration tests. Two Hostel A students exercise the
# owner checks; a Hostel B supervisor exercises the cross-hostel access checks.
SEED_USERS = [
    ("student@giki.edu.pk", "Demo Student", "Hostel A", UserRole.STUDENT),
    ("student2@giki.edu.pk", "Second Student", "Hostel A", UserRole.STUDENT),
    ("supervisor@giki.edu.pk", "Demo Supervisor", "Hostel A", UserRole.HOSTEL_SUPERVISOR),
    ("supervisorB@giki.edu.pk", "Hostel B Supervisor", "Hostel B", UserRole.HOSTEL_SUPERVISOR),
    ("maintenance@giki.edu.pk", "Demo Maintenance", None, UserRole.MAINTENANCE_OFFICE),
]


@pytest_asyncio.fixture
async def integration_client(tmp_path):
    """
    Real end-to-end client backed by a throwaway SQLite database.

    Unlike the mocked ``client`` fixture, this drives the actual service +
    repository + ORM layers, so tests exercise real authorization, state
    transitions, and serialization.
    """
    db_url = f"sqlite+aiosqlite:///{tmp_path / 'test.db'}"
    engine = create_async_engine(db_url)
    TestSession = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
            User(email=email, full_name=name, hostel=hostel, role_id=roles[role].id)
            for email, name, hostel, role in SEED_USERS
        )
        await session.commit()

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


@pytest_asyncio.fixture
async def auth_headers(integration_client):
    """Return an async ``login(email) -> {Authorization: Bearer ...}`` helper."""

    async def _login(email: str) -> dict[str, str]:
        response = await integration_client.post("/api/v1/auth/login", json={"email": email})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _login
