import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to default local address if not supplied, but it should be configured in .env
    DATABASE_URL = "postgresql://fixora_user:fixora_password@localhost:5432/fixora_db"

# Create Database Engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Check connection validity before using it
    pool_size=10,        # Number of connections to keep open
    max_overflow=20     # Max overflow connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session context.
    Ensures that database sessions are closed correctly after requests.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
