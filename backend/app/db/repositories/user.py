from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.repositories.base import BaseRepository

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

user_repo = UserRepository()
