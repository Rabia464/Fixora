from app.db.session import Base

from .audit_log import AuditLog
from .complaint import Complaint
from .notification import Notification
from .role import Role
from .user import User

# Expose models for Alembic auto-generation
__all__ = ["Base", "Role", "User", "Complaint", "Notification", "AuditLog"]
