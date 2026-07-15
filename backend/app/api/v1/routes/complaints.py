from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user_id
from app.api.schemas.complaint_schemas import ComplaintCreate, ComplaintResponse, ComplaintReopen
from app.services.complaint_service import complaint_service

router = APIRouter()

@router.post("", response_model=ComplaintResponse)
async def create_complaint(
    req: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.create_complaint(db, req, user_id)

@router.get("", response_model=List[ComplaintResponse])
async def get_my_complaints(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.get_student_complaints(db, user_id)

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.get_complaint(db, complaint_id)

@router.patch("/{complaint_id}/confirm", response_model=ComplaintResponse)
async def confirm_complaint(
    complaint_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.confirm_complaint(db, complaint_id, user_id)

@router.patch("/{complaint_id}/reopen", response_model=ComplaintResponse)
async def reopen_complaint(
    complaint_id: UUID,
    req: ComplaintReopen,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.reopen_complaint(db, complaint_id, req.reason, user_id)
