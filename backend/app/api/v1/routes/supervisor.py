from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user_id, get_current_user_role
from app.api.schemas.complaint_schemas import ComplaintReview, ComplaintResponse
from app.services.complaint_service import complaint_service

router = APIRouter()

def verify_supervisor(role: str = Depends(get_current_user_role)):
    if role != "Hostel Supervisor":
        raise HTTPException(status_code=403, detail="Forbidden")

@router.patch("/{complaint_id}/review", response_model=ComplaintResponse, dependencies=[Depends(verify_supervisor)])
async def review_complaint(
    complaint_id: UUID,
    req: ComplaintReview,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.review_complaint(db, complaint_id, req, user_id)

@router.patch("/{complaint_id}/forward", response_model=ComplaintResponse, dependencies=[Depends(verify_supervisor)])
async def forward_complaint(
    complaint_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    return await complaint_service.forward_complaint(db, complaint_id, user_id)
