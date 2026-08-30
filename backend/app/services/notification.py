import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.notification import notification_repo
from app.db.repositories.user import user_repo
from app.domain.enums import NotificationType
from app.domain.enums.role import UserRole


class NotificationService:
    """
    Creates in-app notifications for complaint lifecycle events.
    Does not commit; the calling service owns the transaction boundary.
    """

    async def notify_user(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        complaint_id: uuid.UUID,
        notification_type: NotificationType,
        payload: dict[str, Any],
    ) -> None:
        await notification_repo.create(
            db,
            obj_in={
                "user_id": user_id,
                "complaint_id": complaint_id,
                "type": notification_type,
                "payload": payload,
            },
        )

    async def notify_role(
        self,
        db: AsyncSession,
        *,
        role: UserRole,
        complaint_id: uuid.UUID,
        notification_type: NotificationType,
        payload: dict[str, Any],
    ) -> None:
        users = await user_repo.get_by_role(db, role.value)
        for user in users:
            await self.notify_user(
                db,
                user_id=user.id,
                complaint_id=complaint_id,
                notification_type=notification_type,
                payload=payload,
            )

    async def notify_supervisor_for_hostel(
        self,
        db: AsyncSession,
        *,
        hostel: str,
        complaint_id: uuid.UUID,
        notification_type: NotificationType,
        payload: dict[str, Any],
    ) -> None:
        supervisor = await user_repo.get_supervisor_by_hostel(db, hostel)
        if supervisor:
            await self.notify_user(
                db,
                user_id=supervisor.id,
                complaint_id=complaint_id,
                notification_type=notification_type,
                payload=payload,
            )


notification_service = NotificationService()
