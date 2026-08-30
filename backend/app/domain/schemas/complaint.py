import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import ComplaintPriority, ComplaintStatus


class ComplaintBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    location: str = Field(..., min_length=3, max_length=255)


class ComplaintCreate(ComplaintBase):
    """
    Schema for a student creating a new complaint.
    Only basic details are provided by the student.
    """

    pass


class ComplaintResponse(ComplaintBase):
    """
    Full representation of a complaint returned to clients.
    """

    id: uuid.UUID
    hostel: str
    status: ComplaintStatus

    ai_category: Optional[str] = None
    ai_priority: Optional[ComplaintPriority] = None
    ai_department: Optional[str] = None

    supervisor_override: bool
    overridden_category: Optional[str] = None
    overridden_priority: Optional[ComplaintPriority] = None
    overridden_department: Optional[str] = None

    created_by: uuid.UUID
    supervisor_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupervisorReviewRequest(BaseModel):
    """
    Schema for a Hostel Supervisor reviewing an AI recommendation.
    """

    category: str = Field(..., min_length=2)
    priority: ComplaintPriority
    department: str = Field(..., min_length=2)
    override: bool = Field(
        ..., description="True if the supervisor modified the AI recommendation."
    )


class MaintenanceProgressRequest(BaseModel):
    """
    Schema for Maintenance marking a ticket as InProgress.
    """

    note: Optional[str] = Field(None, max_length=500)


class MaintenanceResolveRequest(BaseModel):
    """
    Schema for Maintenance marking a ticket as Resolved.
    """

    resolution_note: str = Field(..., min_length=5, max_length=1000)


class StudentReopenRequest(BaseModel):
    """
    Schema for a Student reopening a resolved complaint.
    """

    reason: str = Field(..., min_length=10, max_length=1000)
