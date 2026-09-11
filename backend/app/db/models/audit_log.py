from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.mixins import UUIDMixin
from app.db.models.types import enum_column, utcnow
from app.db.session import Base
from app.domain.enums import AuditAction

if TYPE_CHECKING:
    from app.db.models.complaint import Complaint
    from app.db.models.user import User


class AuditLog(Base, UUIDMixin):
    """
    Immutable audit trail for all system state changes.
    Append-only table (no updated_at timestamp).
    """

    __tablename__ = "audit_logs"

    action: Mapped[AuditAction] = mapped_column(enum_column(AuditAction, 100), nullable=False)
    performed_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    complaint_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("complaints.id"), nullable=True, index=True
    )
    details: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    # Relationships
    actor: Mapped["User"] = relationship("User", back_populates="audit_actions")
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="audit_logs")

    # Composite index for viewing the chronological audit trail of a specific complaint
    __table_args__ = (Index("ix_audit_logs_complaint_id_created_at", "complaint_id", "created_at"),)

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action='{self.action}', performed_by={self.performed_by})>"
