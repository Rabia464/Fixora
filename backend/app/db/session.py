from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Create the async engine
engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Base class for SQLAlchemy ORM models (SQLAlchemy 2.0 style)
class Base(DeclarativeBase):
    pass


async def init_models() -> None:
    """
    Create all tables from the ORM metadata.

    Used for the zero-dependency SQLite setup (and tests), where Alembic
    migrations are not run. PostgreSQL deployments should use
    ``alembic upgrade head`` instead, which owns the canonical schema.
    """
    # Import models so their tables are registered on Base.metadata.
    import app.db.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Dependency to yield database sessions
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session per request.
    Automatically manages session lifecycle.
    """
    async with AsyncSessionLocal() as session:
        yield session
