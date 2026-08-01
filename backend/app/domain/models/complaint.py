import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.domain.enums.complaint import ComplaintStatus

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default=ComplaintStatus.OPEN.value)
    
    ai_category = Column(String(100), nullable=True)
    ai_priority = Column(String(50), nullable=True)
    ai_department = Column(String(100), nullable=True)
    
    supervisor_override = Column(Boolean, nullable=False, default=False)
    overridden_category = Column(String(100), nullable=True)
    overridden_priority = Column(String(50), nullable=True)
    overridden_department = Column(String(100), nullable=True)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    creator = relationship("User", foreign_keys=[created_by], back_populates="complaints_created")
    supervisor = relationship("User", foreign_keys=[supervisor_id], back_populates="complaints_supervised")
    
    notifications = relationship("Notification", back_populates="complaint")
    audit_logs = relationship("AuditLog", back_populates="complaint")
