import uuid
from typing import List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.notification import Notification
from app.db.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    """
    Handles database operations strictly for the Notification entity.
    """
    def __init__(self):
        super().__init__(Notification)

    async def get_unread_for_user(self, db: AsyncSession, user_id: uuid.UUID, limit: int = 50) -> List[Notification]:
        """
        Fetch unread notifications for a specific user.
        Uses the composite index (user_id, is_read) for blazing fast reads.
        """
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_all_as_read(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        """
        Bulk update to mark all unread notifications as read for a user.
        Executes a direct UPDATE statement rather than fetching and updating objects.
        """
        await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
            .values(is_read=True)
        )
        # Flush to ensure changes hit DB, but wait for session commit from the caller
        await db.flush()

notification_repo = NotificationRepository()
