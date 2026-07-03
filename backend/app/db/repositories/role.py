from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.role import Role
from app.db.repositories.base import BaseRepository

class RoleRepository(BaseRepository[Role]):
    """
    Handles database operations strictly for the Role entity.
    """
    def __init__(self):
        super().__init__(Role)

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Role]:
        """
        Fetch a role by its unique string name (e.g. 'Student', 'Hostel Supervisor').
        Essential for mapping new users to their database role ID during authentication.
        """
        result = await db.execute(select(Role).where(Role.name == name))
        return result.scalars().first()

role_repo = RoleRepository()
