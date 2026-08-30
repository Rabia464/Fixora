import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict

from app.domain.enums import AuditAction


class AuditLogResponse(BaseModel):
    """
    Schema for returning audit trail records with actor details.
    """

    id: uuid.UUID
    action: AuditAction
    performed_by: uuid.UUID
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    complaint_id: Optional[uuid.UUID] = None
    details: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
