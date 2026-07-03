import pytest
from httpx import AsyncClient, ASGITransport
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
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
