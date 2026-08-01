from fastapi import APIRouter

from .auth import router as auth_router
from .complaints import router as complaints_router
from .supervisor import router as supervisor_router
from .maintenance import router as maintenance_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(complaints_router, prefix="/complaints", tags=["complaints"])
api_router.include_router(supervisor_router, prefix="/supervisor", tags=["supervisor"])
api_router.include_router(maintenance_router, prefix="/maintenance", tags=["maintenance"])
