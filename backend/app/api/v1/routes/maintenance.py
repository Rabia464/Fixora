from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user_id, get_current_user_role
from app.api.schemas.complaint_schemas import ComplaintProgress, ComplaintResolve, ComplaintResponse
from app.services.complaint_service import complaint_service

router = APIRouter()

def verify_maintenance(role: str = Depends(get_current_user_role)):
    if role != "Maintenance Office":
        raise HTTPException(status_code=403, detail="Forbidden")

@router.get("/complaints", response_model=List[ComplaintResponse], dependencies=[Depends(verify_maintenance)])
async def get_maintenance_complaints(db: AsyncSession = Depends(get_db)):
    # Returns all complaints for now. Would filter by department in real impl.
    return await complaint_service.get_all_complaints(db)

@router.patch("/complaints/{complaint_id}/progress", response_model=ComplaintResponse, dependencies=[Depends(verify_maintenance)])
async def progress_complaint(
    complaint_id: UUID,
    req: ComplaintProgress,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.progress_complaint(db, complaint_id, req.note or "", user_id)

@router.patch("/complaints/{complaint_id}/resolve", response_model=ComplaintResponse, dependencies=[Depends(verify_maintenance)])
async def resolve_complaint(
    complaint_id: UUID,
    req: ComplaintResolve,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.resolve_complaint(db, complaint_id, req, user_id)
