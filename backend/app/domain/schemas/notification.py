from pydantic import BaseModel, ConfigDict
from typing import Any, Dict
from datetime import datetime
import uuid

from app.domain.enums import NotificationType

class NotificationResponse(BaseModel):
    """
    Schema for returning notification data to the UI.
    """
    id: uuid.UUID
    user_id: uuid.UUID
    complaint_id: uuid.UUID
    type: NotificationType
    payload: Dict[str, Any]
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
