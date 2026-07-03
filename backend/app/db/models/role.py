from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.session import Base
from app.db.models.mixins import UUIDMixin, TimestampMixin

class Role(Base, UUIDMixin, TimestampMixin):
    """
    Stores the distinct role names used for RBAC.
    """
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"
