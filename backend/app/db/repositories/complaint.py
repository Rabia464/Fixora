import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.complaint import Complaint
from app.db.repositories.base import BaseRepository
from app.domain.enums import ComplaintStatus

class ComplaintRepository(BaseRepository[Complaint]):
    """
    Handles database operations strictly for the Complaint entity.
    """
    def __init__(self):
        super().__init__(Complaint)

    async def get_with_details(self, db: AsyncSession, id: uuid.UUID) -> Optional[Complaint]:
        """
        Fetch a single complaint and eagerly load its author and supervisor.
        Critical for the detail view endpoint to prevent N+1 queries.
        """
        result = await db.execute(
            select(Complaint)
            .options(selectinload(Complaint.author), selectinload(Complaint.supervisor))
            .where(Complaint.id == id)
        )
        return result.scalars().first()

    async def get_multi_by_student(self, db: AsyncSession, student_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """
        Fetch all complaints authored by a specific student.
        Supports the student dashboard.
        """
        result = await db.execute(
            select(Complaint)
            .where(Complaint.created_by == student_id)
            .order_by(Complaint.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_multi_by_supervisor_and_status(self, db: AsyncSession, supervisor_id: uuid.UUID, status: ComplaintStatus, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """
        Fetch complaints assigned to a supervisor filtered by a specific status.
        Utilizes the composite index defined in the model for performance.
        """
        result = await db.execute(
            select(Complaint)
            .where(Complaint.supervisor_id == supervisor_id)
            .where(Complaint.status == status)
            .order_by(Complaint.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_forwarded_to_maintenance(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """
        Fetch complaints that are currently in the Maintenance workflow (Forwarded, InProgress).
        Supports the Maintenance Office dashboard.
        """
        result = await db.execute(
            select(Complaint)
            .where(Complaint.status.in_([ComplaintStatus.FORWARDED, ComplaintStatus.IN_PROGRESS]))
            .order_by(Complaint.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

complaint_repo = ComplaintRepository()
