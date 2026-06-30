# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.infra.database import get_db, engine
from sqlalchemy import text
import logging

# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fixora-backend")

app = FastAPI(
    title="Fixora API",
    description="Backend service for Fixora - AI-powered hostel complaint management system.",
    version="1.0.0"
)

# Enable CORS for Next.js web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to Vercel/localhost domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": "Fixora API Backend",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/healthz")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify both the service and DB connection are operational.
    """
    try:
        # Run a simple query to confirm database responsiveness
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check database connection failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
