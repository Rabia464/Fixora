from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.repositories.base import BaseRepository
from app.domain.models.complaint import Complaint

class ComplaintRepository(BaseRepository[Complaint]):
    async def get_by_student(self, db: AsyncSession, student_id: UUID) -> List[Complaint]:
        result = await db.execute(select(self.model).filter(self.model.created_by == student_id))
        return result.scalars().all()

    async def get_by_status(self, db: AsyncSession, statuses: List[str]) -> List[Complaint]:
        result = await db.execute(select(self.model).filter(self.model.status.in_(statuses)))
        return result.scalars().all()

complaint_repo = ComplaintRepository(Complaint)
