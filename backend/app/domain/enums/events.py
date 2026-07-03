from enum import Enum

class NotificationType(str, Enum):
    """
    Defines the categories of in-app notifications sent to users.
    """
    COMPLAINT_CREATED = "ComplaintCreated"
    STATUS_UPDATED = "StatusUpdated"
    MAINTENANCE_STARTED = "MaintenanceStarted"
    RESOLUTION_PENDING_CONFIRMATION = "ResolutionPendingConfirmation"
    COMPLAINT_REOPENED = "ComplaintReopened"
    COMPLAINT_CLOSED = "ComplaintClosed"

class AuditAction(str, Enum):
    """
    Defines the types of actions logged in the immutable audit trail.
    """
    TICKET_CREATED = "TicketCreated"
    SUPERVISOR_REVIEWED = "SupervisorReviewed"
    SUPERVISOR_OVERRIDE = "SupervisorOverride"
    FORWARDED_TO_MAINTENANCE = "ForwardedToMaintenance"
    STATUS_UPDATED = "StatusUpdated"
    STUDENT_CONFIRMED = "StudentConfirmed"
    STUDENT_REOPENED = "StudentReopened"
    SYSTEM_AUTO_CLOSED = "SystemAutoClosed"
