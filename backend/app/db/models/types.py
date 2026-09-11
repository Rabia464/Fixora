from datetime import datetime, timezone
from enum import Enum
from typing import Type

from sqlalchemy import Enum as SAEnum


def utcnow() -> datetime:
    """
    Timezone-aware UTC now, applied Python-side for created_at/updated_at.

    Using a Python-side default/onupdate (rather than a server-side func.now())
    means SQLAlchemy populates the value during flush without marking the
    attribute expired. That avoids a post-commit lazy refresh, which under the
    async engine would raise MissingGreenlet when the response is serialized.
    """
    return datetime.now(timezone.utc)


def enum_column(enum_cls: Type[Enum], length: int) -> SAEnum:
    """
    Build a dialect-agnostic Enum column that round-trips as its Python enum.

    Uses ``native_enum=False`` so the value is stored as a VARCHAR with a CHECK
    constraint (works identically on SQLite and PostgreSQL), and
    ``values_callable`` so the enum's *value* (e.g. "Open") is persisted rather
    than its member name (e.g. "OPEN"). SQLAlchemy applies the matching result
    processor on load, so attributes like ``complaint.status`` come back as the
    real enum instead of a bare string — which is what the annotated
    ``Mapped[...]`` type promises and what the service layer relies on.
    """
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda e: [member.value for member in e],
        validate_strings=True,
    )
