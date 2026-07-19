import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    get_current_user,
    get_current_student,
    get_current_supervisor,
    get_current_maintenance,
)
from app.core.exceptions import ForbiddenException
from app.db.models.user import User
from app.db.session import get_db
from app.domain.enums.complaint import ComplaintStatus
from app.domain.enums.role import UserRole
from app.domain.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    SupervisorReviewRequest,
    MaintenanceProgressRequest,
    MaintenanceResolveRequest,
    StudentReopenRequest,
)
from app.services.complaint import complaint_service

router = APIRouter(prefix="", tags=["Complaints"])

@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Create a new complaint (Student only)."""
    return await complaint_service.create_complaint(db, data, current_user.id)


@router.get("/complaints", response_model=List[ComplaintResponse])
async def get_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[ComplaintStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ComplaintResponse]:
    """Get complaints dashboard for Student or Supervisor."""
    if current_user.role.name == UserRole.STUDENT.value:
        return await complaint_service.get_student_dashboard(db, current_user.id, skip, limit)
    elif current_user.role.name == UserRole.HOSTEL_SUPERVISOR.value:
        # Default to OPEN if not specified, since service method requires a status
        query_status = status_filter if status_filter else ComplaintStatus.OPEN
        return await complaint_service.get_supervisor_dashboard(db, current_user.id, query_status, skip, limit)
    else:
        raise ForbiddenException("Maintenance users should use the /maintenance/complaints endpoint.")


@router.get("/maintenance/complaints", response_model=List[ComplaintResponse])
async def get_maintenance_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_maintenance),
    db: AsyncSession = Depends(get_db),
) -> List[ComplaintResponse]:
    """Get maintenance queue dashboard (Maintenance only)."""
    return await complaint_service.get_maintenance_dashboard(db, current_user.id, skip, limit)


@router.get("/complaints/{id}", response_model=ComplaintResponse)
async def get_complaint(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Get a single complaint by ID."""
    return await complaint_service.get_complaint(db, id, current_user.id)


@router.patch("/complaints/{id}/review", response_model=ComplaintResponse)
async def supervisor_review(
    id: uuid.UUID,
    data: SupervisorReviewRequest,
    current_user: User = Depends(get_current_supervisor),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Supervisor reviews and potentially overrides AI recommendation."""
    return await complaint_service.supervisor_review(db, id, current_user.id, data)


@router.patch("/complaints/{id}/forward", response_model=ComplaintResponse)
async def forward_to_maintenance(
    id: uuid.UUID,
    current_user: User = Depends(get_current_supervisor),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Supervisor forwards complaint to maintenance."""
    return await complaint_service.forward_to_maintenance(db, id, current_user.id)


@router.patch("/complaints/{id}/progress", response_model=ComplaintResponse)
async def update_maintenance_progress(
    id: uuid.UUID,
    data: MaintenanceProgressRequest,
    current_user: User = Depends(get_current_maintenance),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Maintenance marks a complaint as in progress."""
    return await complaint_service.update_maintenance_progress(db, id, current_user.id, data)


@router.patch("/complaints/{id}/resolve", response_model=ComplaintResponse)
async def resolve_complaint(
    id: uuid.UUID,
    data: MaintenanceResolveRequest,
    current_user: User = Depends(get_current_maintenance),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Maintenance marks a complaint as resolved."""
    return await complaint_service.resolve_complaint(db, id, current_user.id, data)


@router.patch("/complaints/{id}/confirm", response_model=ComplaintResponse)
async def confirm_resolution(
    id: uuid.UUID,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Student confirms resolution and closes the complaint."""
    return await complaint_service.confirm_resolution(db, id, current_user.id)


@router.patch("/complaints/{id}/reopen", response_model=ComplaintResponse)
async def reopen_complaint(
    id: uuid.UUID,
    data: StudentReopenRequest,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Student reopens a resolved or closed complaint."""
    return await complaint_service.reopen_complaint(db, id, current_user.id, data)
