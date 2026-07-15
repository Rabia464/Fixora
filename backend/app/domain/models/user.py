import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hostel = Column(String(100), nullable=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    role = relationship("Role", back_populates="users")
    
    # Relationships to Complaint
    complaints_created = relationship("Complaint", foreign_keys="[Complaint.created_by]", back_populates="creator")
    complaints_supervised = relationship("Complaint", foreign_keys="[Complaint.supervisor_id]", back_populates="supervisor")
    
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="performed_by_user")
