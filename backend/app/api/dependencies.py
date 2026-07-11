from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenException
from app.db.models.user import User
from app.db.session import get_db
from app.domain.enums.role import UserRole
from app.services.auth import auth_service


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")),
) -> User:
    return await auth_service.validate_token(db, token)


async def get_current_student(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role.name != UserRole.STUDENT.value:
        raise ForbiddenException("Only students can perform this action.")
    return current_user


async def get_current_supervisor(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role.name != UserRole.HOSTEL_SUPERVISOR.value:
        raise ForbiddenException("Only hostel supervisors can perform this action.")
    return current_user


async def get_current_maintenance(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role.name != UserRole.MAINTENANCE_OFFICE.value:
        raise ForbiddenException("Only maintenance office can perform this action.")
    return current_user
