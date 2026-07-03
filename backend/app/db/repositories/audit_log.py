import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.audit_log import AuditLog
from app.db.repositories.base import BaseRepository

class AuditLogRepository(BaseRepository[AuditLog]):
    """
    Handles database operations strictly for the AuditLog entity.
    """
    def __init__(self):
        super().__init__(AuditLog)

    async def get_by_complaint(self, db: AsyncSession, complaint_id: uuid.UUID) -> List[AuditLog]:
        """
        Fetch the entire chronological history of a specific complaint.
        Eagerly loads the actor (User) so the UI can display who performed the action.
        """
        result = await db.execute(
            select(AuditLog)
            .options(selectinload(AuditLog.actor))
            .where(AuditLog.complaint_id == complaint_id)
            .order_by(AuditLog.created_at.asc())
        )
        return list(result.scalars().all())

audit_log_repo = AuditLogRepository()
