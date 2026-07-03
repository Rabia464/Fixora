from enum import Enum

class ComplaintStatus(str, Enum):
    """
    Defines the strict lifecycle states of a complaint.
    Transitions are strictly ordered: Open -> UnderReview -> Forwarded -> InProgress -> Resolved -> Closed.
    Reopened creates a new lifecycle.
    """
    OPEN = "Open"
    UNDER_REVIEW = "UnderReview"
    FORWARDED = "Forwarded"
    IN_PROGRESS = "InProgress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"
    REOPENED = "Reopened"

class ComplaintPriority(str, Enum):
    """
    Defines the priority levels for a complaint, assigned either by the AI module
    or manually overridden by a Hostel Supervisor.
    """
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"
