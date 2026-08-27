from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.db.models.user import User
from app.db.repositories.user import user_repo
from app.db.session import get_db
from app.domain.schemas.auth import LoginRequest, Token
from app.domain.schemas.user import UserResponse
from app.core.exceptions import UnauthorizedException

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token, summary="Authenticate with GIKI email")
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """
    Authenticate a registered user with their official GIKI email address.
    Returns a signed JWT access token valid for ACCESS_TOKEN_EXPIRE_MINUTES minutes.
    """
    user: User | None = await user_repo.get_by_email(db, body.email)
    if not user:
        raise UnauthorizedException("User not registered in the Fixora system.")

    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        role=user.role.name,
    )
    return Token(access_token=access_token, token_type="Bearer", role=user.role.name)


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Returns the authenticated user's profile.
    Requires a valid JWT in the Authorization: Bearer header.
    """
    return UserResponse.model_validate(current_user)
