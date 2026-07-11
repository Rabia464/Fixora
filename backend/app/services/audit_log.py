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


audit_log_service = AuditLogService()
