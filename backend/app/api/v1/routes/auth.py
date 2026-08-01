from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.schemas.user_schemas import LoginRequest, TokenResponse
from app.services.auth_service import auth_service

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login using GIKI email.
    """
    return await auth_service.login(db, req.email)
