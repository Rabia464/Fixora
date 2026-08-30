import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.domain.schemas.audit_log import AuditLogResponse
from app.services.audit_log import audit_log_service

router = APIRouter(prefix="/complaints", tags=["Audit Logs"])


@router.get("/{id}/audit_logs", response_model=List[AuditLogResponse])
async def get_complaint_audit_logs(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[AuditLogResponse]:
    """
    Fetch the chronological audit log history for a specific complaint.
    Enforces the exact same RBAC rules as viewing the complaint itself.
    """
    logs = await audit_log_service.get_complaint_audit_logs(db, id, current_user.id)
    return [
        AuditLogResponse(
            id=log.id,
            action=log.action,
            performed_by=log.performed_by,
            actor_name=log.actor.full_name if log.actor else None,
            actor_email=log.actor.email if log.actor else None,
            complaint_id=log.complaint_id,
            details=log.details,
            created_at=log.created_at,
        )
        for log in logs
    ]
