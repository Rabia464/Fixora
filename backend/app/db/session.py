from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create the async engine
# echo=False prevents spamming SQL queries in production logs
engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,  # Automatically tests connections before using them
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for SQLAlchemy ORM models
Base = declarative_base()

# Dependency to yield database sessions
async def get_db():
    """
    FastAPI dependency that provides a database session per request.
    Ensures the session is closed after the request completes.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
