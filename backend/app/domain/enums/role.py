from enum import Enum

class UserRole(str, Enum):
    """
    Defines the role-based access control (RBAC) levels in the system.
    Matches the static roles defined in the roles table.
    Inherits from str so it can be directly serialized to JSON by FastAPI.
    """
    STUDENT = "Student"
    HOSTEL_SUPERVISOR = "Hostel Supervisor"
    MAINTENANCE_OFFICE = "Maintenance Office"
