import uuid
from sqlalchemy import String, Text, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.session import Base
from app.db.models.mixins import UUIDMixin, TimestampMixin
from app.domain.enums import ComplaintStatus, ComplaintPriority

class Complaint(Base, UUIDMixin, TimestampMixin):
    """
    Core ticket entity. Tracks the lifecycle from creation to resolution.
    Includes both AI-generated fields and potential manual supervisor overrides.
    """
    __tablename__ = "complaints"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    hostel: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[ComplaintStatus] = mapped_column(String(20), nullable=False, index=True)

    # AI Recommendation Fields (Nullable if AI fails)
    ai_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_priority: Mapped[ComplaintPriority | None] = mapped_column(String(50), nullable=True)
    ai_department: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Supervisor Review Fields
    supervisor_override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    overridden_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    overridden_priority: Mapped[ComplaintPriority | None] = mapped_column(String(50), nullable=True)
    overridden_department: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Foreign Keys
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    supervisor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    # Relationships
    author: Mapped["User"] = relationship("User", foreign_keys=[created_by], back_populates="authored_complaints")
    supervisor: Mapped["User"] = relationship("User", foreign_keys=[supervisor_id], back_populates="supervised_complaints")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="complaint")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="complaint")

    # Composite Indexes
    __table_args__ = (
        Index("ix_complaints_created_by_status", "created_by", "status"),
        Index("ix_complaints_supervisor_id_status", "supervisor_id", "status"),
        Index("ix_complaints_hostel_status", "hostel", "status"),
    )

    def __repr__(self) -> str:
        return f"<Complaint(id={self.id}, status='{self.status}', created_by={self.created_by})>"
