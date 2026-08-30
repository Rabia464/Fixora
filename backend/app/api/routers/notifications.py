from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.notification import notification_repo
from app.db.session import get_db
from app.domain.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_unread_notifications(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[NotificationResponse]:
    """
    Fetch unread notifications for the currently authenticated user.
    """
    notifications = await notification_repo.get_unread_for_user(db, current_user.id, limit)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.patch("/read", status_code=status.HTTP_200_OK)
async def mark_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all unread notifications as read for the currently authenticated user.
    """
    await notification_repo.mark_all_as_read(db, current_user.id)
    await db.commit()
    return {"message": "All notifications marked as read."}
