from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, Optional
from datetime import datetime
import uuid

from app.domain.enums import AuditAction

class AuditLogResponse(BaseModel):
    """
    Schema for returning audit trail records.
    """
    id: uuid.UUID
    action: AuditAction
    performed_by: uuid.UUID
    complaint_id: Optional[uuid.UUID] = None
    details: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
