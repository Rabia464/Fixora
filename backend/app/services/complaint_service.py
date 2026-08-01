from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from fastapi import HTTPException
from typing import List

from app.repositories.complaint_repository import complaint_repo
from app.domain.models.complaint import Complaint
from app.api.schemas.complaint_schemas import ComplaintCreate, ComplaintReview, ComplaintResolve
from app.domain.enums.complaint import ComplaintStatus
from app.ai.engine import AIEngine
from app.domain.models.audit_log import AuditLog

class ComplaintService:
    def __init__(self):
        self.ai_engine = AIEngine()

    async def create_complaint(self, db: AsyncSession, data: ComplaintCreate, user_id: UUID) -> Complaint:
        # Predict Category and Priority
        prediction = self.ai_engine.predict(data.description)
        
        complaint_data = {
            "title": data.title,
            "description": data.description,
            "location": data.location,
            "status": ComplaintStatus.OPEN.value,
            "ai_category": prediction.category,
            "ai_priority": prediction.priority,
            "ai_department": prediction.department,
            "created_by": user_id
        }
        
        complaint = await complaint_repo.create(db, obj_in=complaint_data)
        await self._log_audit(db, "TicketCreated", user_id, complaint.id, complaint_data)
        return complaint

    async def get_complaint(self, db: AsyncSession, complaint_id: UUID) -> Complaint:
        complaint = await complaint_repo.get(db, complaint_id)
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        return complaint

    async def get_student_complaints(self, db: AsyncSession, student_id: UUID) -> List[Complaint]:
        return await complaint_repo.get_by_student(db, student_id)

    async def get_all_complaints(self, db: AsyncSession) -> List[Complaint]:
        # Would normally filter by hostel for supervisor
        return await complaint_repo.get_multi(db)

    async def review_complaint(self, db: AsyncSession, complaint_id: UUID, data: ComplaintReview, user_id: UUID) -> Complaint:
        complaint = await self.get_complaint(db, complaint_id)
        
        update_data = {
            "status": ComplaintStatus.UNDER_REVIEW.value,
            "overridden_category": data.category,
            "overridden_priority": data.priority,
            "overridden_department": data.department,
            "supervisor_override": data.override,
            "supervisor_id": user_id
        }
        
        updated = await complaint_repo.update(db, db_obj=complaint, obj_in=update_data)
        await self._log_audit(db, "SupervisorReview", user_id, complaint.id, update_data)
        return updated

    async def forward_complaint(self, db: AsyncSession, complaint_id: UUID, user_id: UUID) -> Complaint:
        complaint = await self.get_complaint(db, complaint_id)
        if complaint.status != ComplaintStatus.UNDER_REVIEW.value:
            raise HTTPException(status_code=409, detail="Complaint not under review")
            
        updated = await complaint_repo.update(db, db_obj=complaint, obj_in={"status": ComplaintStatus.FORWARDED.value})
        await self._log_audit(db, "Forwarded", user_id, complaint.id, {"status": ComplaintStatus.FORWARDED.value})
        return updated

    async def progress_complaint(self, db: AsyncSession, complaint_id: UUID, note: str, user_id: UUID) -> Complaint:
        complaint = await self.get_complaint(db, complaint_id)
        if complaint.status != ComplaintStatus.FORWARDED.value:
            raise HTTPException(status_code=409, detail="Complaint not forwarded")
            
        updated = await complaint_repo.update(db, db_obj=complaint, obj_in={"status": ComplaintStatus.IN_PROGRESS.value})
        await self._log_audit(db, "InProgress", user_id, complaint.id, {"note": note})
        return updated
        
    async def resolve_complaint(self, db: AsyncSession, complaint_id: UUID, data: ComplaintResolve, user_id: UUID) -> Complaint:
        complaint = await self.get_complaint(db, complaint_id)
        if complaint.status != ComplaintStatus.IN_PROGRESS.value:
            raise HTTPException(status_code=409, detail="Complaint not in progress")
            
        updated = await complaint_repo.update(db, db_obj=complaint, obj_in={"status": ComplaintStatus.RESOLVED.value})
        await self._log_audit(db, "Resolved", user_id, complaint.id, {"resolution_note": data.resolution_note})
        return updated

    async def confirm_complaint(self, db: AsyncSession, complaint_id: UUID, user_id: UUID) -> Complaint:
        complaint = await self.get_complaint(db, complaint_id)
        if complaint.status != ComplaintStatus.RESOLVED.value:
            raise HTTPException(status_code=409, detail="Complaint not resolved")
            
        updated = await complaint_repo.update(db, db_obj=complaint, obj_in={"status": ComplaintStatus.CLOSED.value})
        await self._log_audit(db, "Closed", user_id, complaint.id, {"status": ComplaintStatus.CLOSED.value})
        return updated

    async def reopen_complaint(self, db: AsyncSession, complaint_id: UUID, reason: str, user_id: UUID) -> Complaint:
        complaint = await self.get_complaint(db, complaint_id)
        if complaint.status not in [ComplaintStatus.RESOLVED.value, ComplaintStatus.CLOSED.value]:
            raise HTTPException(status_code=409, detail="Complaint cannot be reopened")
            
        updated = await complaint_repo.update(db, db_obj=complaint, obj_in={"status": ComplaintStatus.REOPENED.value})
        await self._log_audit(db, "Reopened", user_id, complaint.id, {"reason": reason})
        return updated

    async def _log_audit(self, db: AsyncSession, action: str, user_id: UUID, complaint_id: UUID, details: dict):
        log = AuditLog(
            action=action,
            performed_by=user_id,
            complaint_id=complaint_id,
            details=details
        )
        db.add(log)
        await db.commit()

complaint_service = ComplaintService()
