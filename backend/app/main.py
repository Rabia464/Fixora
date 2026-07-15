from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.routes import api_router

def create_app() -> FastAPI:
    """
    Application factory pattern. Creates and configures the FastAPI instance.
    This pattern ensures clean testability by allowing multiple isolated app instances.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    # Set up CORS for the React frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, this should be restricted to the frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include the main API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}

    return app

app = create_app()
