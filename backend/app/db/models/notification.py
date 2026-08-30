from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.mixins import UUIDMixin
from app.db.session import Base
from app.domain.enums import NotificationType

if TYPE_CHECKING:
    from app.db.models.complaint import Complaint
    from app.db.models.user import User


class Notification(Base, UUIDMixin):
    """
    Stores in-app notifications.
    Note: Notifications are largely immutable except for the `is_read` flag.
    Thus, we only use a created_at timestamp, not updated_at.
    """

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("complaints.id"), nullable=False, index=True
    )
    type: Mapped[NotificationType] = mapped_column(String(50), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="notifications")

    # Composite index for querying a user's unread notifications
    __table_args__ = (Index("ix_notifications_user_id_is_read", "user_id", "is_read"),)

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.type}')>"
