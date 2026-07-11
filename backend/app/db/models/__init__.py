from app.db.session import Base
from .role import Role
from .user import User
from .complaint import Complaint
from .notification import Notification
from .audit_log import AuditLog

# Expose models for Alembic auto-generation
__all__ = [
    "Base",
    "Role",
    "User",
    "Complaint",
    "Notification",
    "AuditLog"
]
