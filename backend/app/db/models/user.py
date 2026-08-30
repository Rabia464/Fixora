from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.mixins import TimestampMixin, UUIDMixin
from app.db.session import Base

if TYPE_CHECKING:
    from app.db.models.audit_log import AuditLog
    from app.db.models.complaint import Complaint
    from app.db.models.notification import Notification
    from app.db.models.role import Role


class User(Base, UUIDMixin, TimestampMixin):
    """
    Represents all authenticated actors in the system.
    Authenticates via GIKI email.
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hostel: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"), nullable=False, index=True)

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users")

    # A user can author many complaints
    authored_complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint", foreign_keys="Complaint.created_by", back_populates="author"
    )

    # A supervisor can review many complaints
    supervised_complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint", foreign_keys="Complaint.supervisor_id", back_populates="supervisor"
    )

    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    audit_actions: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="actor")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
