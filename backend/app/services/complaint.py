import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    BusinessLogicException,
)
from app.db.models.complaint import Complaint
from app.db.models.user import User
from app.db.repositories.user import user_repo
from app.db.repositories.complaint import complaint_repo
from app.domain.enums.role import UserRole
from app.domain.enums.complaint import ComplaintStatus
from app.domain.enums.events import AuditAction, NotificationType
from app.domain.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    SupervisorReviewRequest,
    MaintenanceProgressRequest,
    MaintenanceResolveRequest,
    StudentReopenRequest,
)
from app.services.ai import ai_service
from app.services.audit_log import audit_log_service
from app.services.notification import notification_service

class ComplaintService:
    """
    Service handling business logic for Complaints.
    Enforces authorization, utilizes repository layer, and returns Pydantic DTOs.
    """

    async def _get_user_model(self, db: AsyncSession, user_id: uuid.UUID) -> User:
        user = await user_repo.get_with_role(db, user_id)
        if not user:
            raise UnauthorizedException("User not found.")
        return user

    def _assert_role_student(self, user: User) -> None:
        if user.role.name != UserRole.STUDENT.value:
            raise ForbiddenException("Only students can perform this action.")

    def _assert_role_supervisor(self, user: User) -> None:
        if user.role.name != UserRole.HOSTEL_SUPERVISOR.value:
            raise ForbiddenException("Only hostel supervisors can perform this action.")

    def _assert_role_maintenance(self, user: User) -> None:
        if user.role.name != UserRole.MAINTENANCE_OFFICE.value:
            raise ForbiddenException("Only maintenance office can perform this action.")

    def _assert_complaint_owner(self, complaint: Complaint, user: User) -> None:
        if complaint.created_by != user.id:
            raise ForbiddenException("Students can only perform this action on their own complaints.")

    def _assert_user_has_hostel(self, user: User, role_label: str) -> str:
        if not user.hostel:
            raise BusinessLogicException(
                detail=f"{role_label} has no hostel assigned.",
                status_code=422,
            )
        return user.hostel

    def _assert_complaint_supervisor_access(self, complaint: Complaint, user: User) -> None:
        supervisor_hostel = self._assert_user_has_hostel(user, "Supervisor")
        if complaint.hostel != supervisor_hostel:
            raise ForbiddenException("Supervisors can only access complaints belonging to their assigned hostel.")

    def _assert_status(self, complaint: Complaint, allowed: List[ComplaintStatus], message: str) -> None:
        if complaint.status not in allowed:
            raise BusinessLogicException(detail=message, status_code=409)

    async def _get_complaint_model(self, db: AsyncSession, complaint_id: uuid.UUID) -> Complaint:
        complaint = await complaint_repo.get_with_details(db, complaint_id)
        if not complaint:
            raise NotFoundException("Complaint", str(complaint_id))
        return complaint

    async def get_complaint(self, db: AsyncSession, complaint_id: uuid.UUID, current_user_id: uuid.UUID) -> ComplaintResponse:
        user = await self._get_user_model(db, current_user_id)
        complaint = await complaint_repo.get_with_details(db, complaint_id)
        
        if not complaint:
            raise NotFoundException("Complaint", str(complaint_id))
            
        role_name = user.role.name
        
        if role_name == UserRole.STUDENT.value:
            if complaint.created_by != user.id:
                raise ForbiddenException("Students can only access their own complaints.")
        elif role_name == UserRole.HOSTEL_SUPERVISOR.value:
            self._assert_complaint_supervisor_access(complaint, user)
        elif role_name == UserRole.MAINTENANCE_OFFICE.value:
            allowed_maintenance_statuses = [
                ComplaintStatus.FORWARDED, 
                ComplaintStatus.IN_PROGRESS,
                ComplaintStatus.RESOLVED,
                ComplaintStatus.CLOSED,
                ComplaintStatus.REOPENED
            ]
            if complaint.status not in allowed_maintenance_statuses:
                raise ForbiddenException("Maintenance users can only access complaints in the maintenance workflow.")
        else:
            raise ForbiddenException("Role not authorized to access complaints.")
            
        return ComplaintResponse.model_validate(complaint)

    async def get_student_dashboard(self, db: AsyncSession, student_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[ComplaintResponse]:
        user = await self._get_user_model(db, student_id)
        self._assert_role_student(user)
        
        complaints = await complaint_repo.get_multi_by_student(db, student_id, skip, limit)
        return [ComplaintResponse.model_validate(c) for c in complaints]

    async def get_supervisor_dashboard(self, db: AsyncSession, supervisor_id: uuid.UUID, status: ComplaintStatus, skip: int = 0, limit: int = 100) -> List[ComplaintResponse]:
        user = await self._get_user_model(db, supervisor_id)
        self._assert_role_supervisor(user)
        supervisor_hostel = self._assert_user_has_hostel(user, "Supervisor")

        complaints = await complaint_repo.get_multi_by_hostel_and_status(db, supervisor_hostel, status, skip, limit)
        return [ComplaintResponse.model_validate(c) for c in complaints]

    async def get_maintenance_dashboard(self, db: AsyncSession, current_user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[ComplaintResponse]:
        user = await self._get_user_model(db, current_user_id)
        self._assert_role_maintenance(user)
        
        complaints = await complaint_repo.get_forwarded_to_maintenance(db, skip, limit)
        return [ComplaintResponse.model_validate(c) for c in complaints]

    async def create_complaint(
        self,
        db: AsyncSession,
        data: ComplaintCreate,
        current_user_id: uuid.UUID,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_student(user)
            student_hostel = self._assert_user_has_hostel(user, "Student")

            ai_result = ai_service.predict(data.title, data.description)

            supervisor = await user_repo.get_supervisor_by_hostel(db, student_hostel)
            if not supervisor:
                raise BusinessLogicException(
                    detail=f"No hostel supervisor configured for {student_hostel}.",
                    status_code=422,
                )

            complaint = await complaint_repo.create(
                db,
                obj_in={
                    "title": data.title,
                    "description": data.description,
                    "location": data.location,
                    "hostel": student_hostel,
                    "status": ComplaintStatus.OPEN,
                    "ai_category": ai_result["category"],
                    "ai_priority": ai_result["priority"],
                    "ai_department": ai_result["department"],
                    "supervisor_override": False,
                    "created_by": user.id,
                    "supervisor_id": supervisor.id,
                },
            )

            await audit_log_service.log(
                db,
                action=AuditAction.TICKET_CREATED,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "title": data.title,
                    "location": data.location,
                    "hostel": student_hostel,
                    "ai_category": ai_result["category"],
                    "ai_priority": ai_result["priority"].value if ai_result["priority"] else None,
                    "ai_department": ai_result["department"],
                },
            )

            await notification_service.notify_user(
                db,
                user_id=supervisor.id,
                complaint_id=complaint.id,
                notification_type=NotificationType.COMPLAINT_CREATED,
                payload={
                    "complaint_id": str(complaint.id),
                    "title": complaint.title,
                    "location": complaint.location,
                    "hostel": student_hostel,
                },
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

    async def supervisor_review(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
        review: SupervisorReviewRequest,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_supervisor(user)

            complaint = await self._get_complaint_model(db, complaint_id)
            self._assert_complaint_supervisor_access(complaint, user)
            self._assert_status(
                complaint,
                [ComplaintStatus.OPEN, ComplaintStatus.REOPENED],
                "Complaint must be in Open or Reopened status to review.",
            )

            previous_status = complaint.status
            complaint.overridden_category = review.category
            complaint.overridden_priority = review.priority
            complaint.overridden_department = review.department
            complaint.supervisor_override = review.override
            complaint.status = ComplaintStatus.UNDER_REVIEW

            audit_action = (
                AuditAction.SUPERVISOR_OVERRIDE
                if review.override
                else AuditAction.SUPERVISOR_REVIEWED
            )
            await audit_log_service.log(
                db,
                action=audit_action,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "category": review.category,
                    "priority": review.priority.value,
                    "department": review.department,
                    "override": review.override,
                    "previous_status": previous_status.value,
                    "new_status": ComplaintStatus.UNDER_REVIEW.value,
                },
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

    async def forward_to_maintenance(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_supervisor(user)

            complaint = await self._get_complaint_model(db, complaint_id)
            self._assert_complaint_supervisor_access(complaint, user)
            self._assert_status(
                complaint,
                [ComplaintStatus.UNDER_REVIEW],
                "Complaint has not been reviewed and cannot be forwarded.",
            )

            previous_status = complaint.status
            complaint.status = ComplaintStatus.FORWARDED

            await audit_log_service.log(
                db,
                action=AuditAction.FORWARDED_TO_MAINTENANCE,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "previous_status": previous_status.value,
                    "new_status": ComplaintStatus.FORWARDED.value,
                },
            )

            await notification_service.notify_role(
                db,
                role=UserRole.MAINTENANCE_OFFICE,
                complaint_id=complaint.id,
                notification_type=NotificationType.STATUS_UPDATED,
                payload={
                    "complaint_id": str(complaint.id),
                    "title": complaint.title,
                    "status": ComplaintStatus.FORWARDED.value,
                },
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

    async def update_maintenance_progress(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
        progress: MaintenanceProgressRequest,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_maintenance(user)

            complaint = await self._get_complaint_model(db, complaint_id)
            self._assert_status(
                complaint,
                [ComplaintStatus.FORWARDED],
                "Complaint is not in Forwarded status.",
            )

            previous_status = complaint.status
            complaint.status = ComplaintStatus.IN_PROGRESS

            await audit_log_service.log(
                db,
                action=AuditAction.STATUS_UPDATED,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "previous_status": previous_status.value,
                    "new_status": ComplaintStatus.IN_PROGRESS.value,
                    "note": progress.note,
                },
            )

            await notification_service.notify_user(
                db,
                user_id=complaint.created_by,
                complaint_id=complaint.id,
                notification_type=NotificationType.MAINTENANCE_STARTED,
                payload={
                    "complaint_id": str(complaint.id),
                    "title": complaint.title,
                    "status": ComplaintStatus.IN_PROGRESS.value,
                    "note": progress.note,
                },
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

    async def resolve_complaint(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
        resolve_data: MaintenanceResolveRequest,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_maintenance(user)

            complaint = await self._get_complaint_model(db, complaint_id)
            self._assert_status(
                complaint,
                [ComplaintStatus.IN_PROGRESS],
                "Complaint is not in InProgress status.",
            )

            previous_status = complaint.status
            complaint.status = ComplaintStatus.RESOLVED

            await audit_log_service.log(
                db,
                action=AuditAction.STATUS_UPDATED,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "previous_status": previous_status.value,
                    "new_status": ComplaintStatus.RESOLVED.value,
                    "resolution_note": resolve_data.resolution_note,
                },
            )

            await notification_service.notify_user(
                db,
                user_id=complaint.created_by,
                complaint_id=complaint.id,
                notification_type=NotificationType.RESOLUTION_PENDING_CONFIRMATION,
                payload={
                    "complaint_id": str(complaint.id),
                    "title": complaint.title,
                    "status": ComplaintStatus.RESOLVED.value,
                    "resolution_note": resolve_data.resolution_note,
                },
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

    async def confirm_resolution(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_student(user)

            complaint = await self._get_complaint_model(db, complaint_id)
            self._assert_complaint_owner(complaint, user)
            self._assert_status(
                complaint,
                [ComplaintStatus.RESOLVED],
                "Complaint is not in Resolved status.",
            )

            previous_status = complaint.status
            complaint.status = ComplaintStatus.CLOSED

            await audit_log_service.log(
                db,
                action=AuditAction.STUDENT_CONFIRMED,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "previous_status": previous_status.value,
                    "new_status": ComplaintStatus.CLOSED.value,
                },
            )

            await notification_service.notify_role(
                db,
                role=UserRole.MAINTENANCE_OFFICE,
                complaint_id=complaint.id,
                notification_type=NotificationType.COMPLAINT_CLOSED,
                payload={
                    "complaint_id": str(complaint.id),
                    "title": complaint.title,
                    "status": ComplaintStatus.CLOSED.value,
                },
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

    async def reopen_complaint(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user_id: uuid.UUID,
        reopen_data: StudentReopenRequest,
    ) -> ComplaintResponse:
        try:
            user = await self._get_user_model(db, current_user_id)
            self._assert_role_student(user)

            complaint = await self._get_complaint_model(db, complaint_id)
            self._assert_complaint_owner(complaint, user)
            self._assert_status(
                complaint,
                [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED],
                "Complaint is not in Resolved or Closed status.",
            )

            previous_status = complaint.status
            complaint.status = ComplaintStatus.REOPENED

            await audit_log_service.log(
                db,
                action=AuditAction.STUDENT_REOPENED,
                performed_by=user.id,
                complaint_id=complaint.id,
                details={
                    "previous_status": previous_status.value,
                    "new_status": ComplaintStatus.REOPENED.value,
                    "reason": reopen_data.reason,
                },
            )

            payload = {
                "complaint_id": str(complaint.id),
                "title": complaint.title,
                "status": ComplaintStatus.REOPENED.value,
                "reason": reopen_data.reason,
            }

            if complaint.supervisor_id:
                await notification_service.notify_user(
                    db,
                    user_id=complaint.supervisor_id,
                    complaint_id=complaint.id,
                    notification_type=NotificationType.COMPLAINT_REOPENED,
                    payload=payload,
                )
            else:
                supervisor = await user_repo.get_supervisor_by_hostel(db, complaint.hostel)
                if supervisor:
                    await notification_service.notify_user(
                        db,
                        user_id=supervisor.id,
                        complaint_id=complaint.id,
                        notification_type=NotificationType.COMPLAINT_REOPENED,
                        payload=payload,
                    )

            await notification_service.notify_role(
                db,
                role=UserRole.MAINTENANCE_OFFICE,
                complaint_id=complaint.id,
                notification_type=NotificationType.COMPLAINT_REOPENED,
                payload=payload,
            )

            await db.commit()
            return ComplaintResponse.model_validate(complaint)
        except Exception:
            await db.rollback()
            raise

complaint_service = ComplaintService()
