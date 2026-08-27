from __future__ import annotations
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.audit_log import audit_log_repo
from app.domain.enums import AuditAction


class AuditLogService:
    """
    Records immutable audit trail entries for state-changing actions.
    Does not commit; the calling service owns the transaction boundary.
    """

    async def log(
        self,
        db: AsyncSession,
        *,
        action: AuditAction,
        performed_by: uuid.UUID,
        complaint_id: uuid.UUID | None,
        details: dict,
    ) -> None:
        await audit_log_repo.create(
            db,
            obj_in={
                "action": action,
                "performed_by": performed_by,
                "complaint_id": complaint_id,
                "details": details,
            },
        )

    async def get_complaint_audit_logs(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
    ):
        from app.services.complaint import complaint_service
        
        # Enforce central RBAC: If the user can view the complaint, they can view its audit logs
        await complaint_service.get_complaint(db, complaint_id, current_user_id)
        
        return await audit_log_repo.get_by_complaint(db, complaint_id)

audit_log_service = AuditLogService()
