import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.models.role import Role
from app.db.repositories.base import BaseRepository
from app.domain.enums.role import UserRole

class UserRepository(BaseRepository[User]):
    """
    Handles database operations strictly for the User entity.
    """
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Fetch a user by their unique GIKI email.
        Uses selectinload('role') to eagerly load the user's role in a single query, 
        which is highly efficient and required for JWT token generation logic.
        """
        result = await db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email)
        )
        return result.scalars().first()

    async def get_with_role(self, db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """
        Fetch a user by their UUID.
        Uses selectinload('role') to eagerly load the user's role in a single query.
        """
        result = await db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.id == user_id)
        )
        return result.scalars().first()

    async def get_by_role(self, db: AsyncSession, role_name: str) -> List[User]:
        """Fetch all users assigned to a specific role."""
        result = await db.execute(
            select(User)
            .join(Role, User.role_id == Role.id)
            .where(Role.name == role_name)
        )
        return list(result.scalars().all())

    async def get_supervisor_by_hostel(self, db: AsyncSession, hostel: str) -> Optional[User]:
        """Fetch the hostel supervisor assigned to a given hostel."""
        result = await db.execute(
            select(User)
            .join(Role, User.role_id == Role.id)
            .options(selectinload(User.role))
            .where(Role.name == UserRole.HOSTEL_SUPERVISOR.value)
            .where(User.hostel == hostel)
        )
        return result.scalars().first()

user_repo = UserRepository()
