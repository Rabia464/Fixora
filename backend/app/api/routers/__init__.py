from fastapi import APIRouter

from app.api.routers.auth import router as auth_router
from app.api.routers.complaints import router as complaints_router
from app.api.routers.notifications import router as notifications_router
from app.api.routers.audit_logs import router as audit_logs_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(complaints_router)
api_router.include_router(notifications_router)
api_router.include_router(audit_logs_router)


