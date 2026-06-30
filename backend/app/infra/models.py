from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import enum

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class TicketCategory(str, enum.Enum):
    ELECTRICAL = "ELECTRICAL"
    PLUMBING = "PLUMBING"
    CARPENTRY = "CARPENTRY"
    HOUSEKEEPING = "HOUSEKEEPING"
    INTERNET = "INTERNET"
    OTHER = "OTHER"

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TicketStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    REOPENED = "REOPENED"

class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    student_profile: Mapped[Optional["StudentProfileModel"]] = relationship("StudentProfileModel", back_populates="user", uselist=False)
    staff_profile: Mapped[Optional["StaffProfileModel"]] = relationship("StaffProfileModel", back_populates="user", uselist=False)
    comments: Mapped[List["CommentModel"]] = relationship("CommentModel", back_populates="user")

class StudentProfileModel(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    room_number: Mapped[str] = mapped_column(String(50), nullable=False)
    hostel_block: Mapped[str] = mapped_column(String(50), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationships
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="student_profile")
    complaints: Mapped[List["ComplaintModel"]] = relationship("ComplaintModel", foreign_keys="[ComplaintModel.student_id]", back_populates="student")

class StaffProfileModel(Base):
    __tablename__ = "staff_profiles"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    specialization: Mapped[TicketCategory] = mapped_column(SQLEnum(TicketCategory), default=TicketCategory.OTHER, nullable=False)
    availability: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relationships
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="staff_profile")
    assignments: Mapped[List["ComplaintModel"]] = relationship("ComplaintModel", foreign_keys="[ComplaintModel.staff_id]", back_populates="staff")

class ComplaintModel(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[TicketCategory] = mapped_column(SQLEnum(TicketCategory), default=TicketCategory.OTHER, nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(SQLEnum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(SQLEnum(TicketStatus), default=TicketStatus.PENDING, nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.user_id", ondelete="CASCADE"), nullable=False)
    staff_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("staff_profiles.user_id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    student: Mapped["StudentProfileModel"] = relationship("StudentProfileModel", foreign_keys=[student_id], back_populates="complaints")
    staff: Mapped[Optional["StaffProfileModel"]] = relationship("StaffProfileModel", foreign_keys=[staff_id], back_populates="assignments")
    attachments: Mapped[List["MediaAttachmentModel"]] = relationship("MediaAttachmentModel", back_populates="complaint", cascade="all, delete-orphan")
    comments: Mapped[List["CommentModel"]] = relationship("CommentModel", back_populates="complaint", cascade="all, delete-orphan")
    feedback: Mapped[Optional["FeedbackModel"]] = relationship("FeedbackModel", back_populates="complaint", uselist=False, cascade="all, delete-orphan")

class MediaAttachmentModel(Base):
    __tablename__ = "media_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_id: Mapped[int] = mapped_column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaint: Mapped["ComplaintModel"] = relationship("ComplaintModel", back_populates="attachments")

class CommentModel(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_id: Mapped[int] = mapped_column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaint: Mapped["ComplaintModel"] = relationship("ComplaintModel", back_populates="comments")
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="comments")

class FeedbackModel(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_id: Mapped[int] = mapped_column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), primary_key=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaint: Mapped["ComplaintModel"] = relationship("ComplaintModel", back_populates="feedback")
