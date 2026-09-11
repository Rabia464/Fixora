import uuid
from datetime import datetime

from sqlalchemy import DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.types import utcnow


class TimestampMixin:
    """
    Mixin that adds created_at and updated_at columns to models.
    Timestamps are applied Python-side (see ``utcnow``) so they populate during
    flush without triggering a post-commit refresh under the async engine, and
    work identically on SQLite and PostgreSQL.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )


class UUIDMixin:
    """
    Mixin to standardize UUID primary keys across all tables.
    Uses the dialect-agnostic Uuid type: native UUID on PostgreSQL,
    CHAR(32) on SQLite.
    """

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
