from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.domain.enums.complaint import ComplaintStatus, ComplaintPriority

class ComplaintCreate(BaseModel):
    title: str
    description: str
    location: str

class ComplaintResponse(BaseModel):
    id: UUID
    title: str
    description: str
    location: str
    status: str
    
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_department: Optional[str] = None
    
    supervisor_override: bool
    overridden_category: Optional[str] = None
    overridden_priority: Optional[str] = None
    overridden_department: Optional[str] = None
    
    created_by: UUID
    supervisor_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintReview(BaseModel):
    category: str
    priority: str
    department: str
    override: bool

class ComplaintProgress(BaseModel):
    note: Optional[str] = None

class ComplaintResolve(BaseModel):
    resolution_note: str

class ComplaintReopen(BaseModel):
    reason: str
