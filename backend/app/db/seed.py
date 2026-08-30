import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditLog, Complaint, Role, User
from app.db.session import AsyncSessionLocal
from app.domain.enums import AuditAction, ComplaintPriority, ComplaintStatus, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_USERS = [
    {
        "email": "student@giki.edu.pk",
        "full_name": "Demo Student",
        "hostel": "Hostel A",
        "role": UserRole.STUDENT,
    },
    {
        "email": "supervisor@giki.edu.pk",
        "full_name": "Demo Hostel Supervisor",
        "hostel": "Hostel A",
        "role": UserRole.HOSTEL_SUPERVISOR,
    },
    {
        "email": "maintenance@giki.edu.pk",
        "full_name": "Demo Maintenance Office",
        "hostel": None,
        "role": UserRole.MAINTENANCE_OFFICE,
    },
]


async def seed_roles(session: AsyncSession) -> None:
    default_roles = [UserRole.STUDENT, UserRole.HOSTEL_SUPERVISOR, UserRole.MAINTENANCE_OFFICE]

    for role_name in default_roles:
        result = await session.execute(select(Role).where(Role.name == role_name.value))
        existing_role = result.scalars().first()

        if not existing_role:
            logger.info(f"Seeding role: {role_name.value}")
            session.add(Role(name=role_name.value))
        else:
            logger.info(f"Role {role_name.value} already exists. Skipping.")

    await session.commit()
    logger.info("Role seeding complete.")


async def seed_users(session: AsyncSession) -> dict[str, User]:
    user_map = {}
    for entry in SEED_USERS:
        result = await session.execute(select(User).where(User.email == entry["email"]))
        user = result.scalars().first()
        if not user:
            role_result = await session.execute(
                select(Role).where(Role.name == entry["role"].value)
            )
            role = role_result.scalars().first()
            if not role:
                raise RuntimeError(f"Role '{entry['role'].value}' not found.")

            logger.info(f"Seeding user: {entry['email']} ({entry['role'].value})")
            user = User(
                email=entry["email"],
                full_name=entry["full_name"],
                hostel=entry["hostel"],
                role_id=role.id,
            )
            session.add(user)
            await session.flush()
        user_map[entry["email"]] = user

    await session.commit()
    logger.info("User seeding complete.")
    return user_map


async def seed_sample_complaints(session: AsyncSession, user_map: dict[str, User]) -> None:
    student = user_map.get("student@giki.edu.pk")
    supervisor = user_map.get("supervisor@giki.edu.pk")
    maintenance = user_map.get("maintenance@giki.edu.pk")

    if not student or not supervisor or not maintenance:
        return

    # Check if complaints already exist
    existing = await session.execute(select(Complaint).limit(1))
    if existing.scalars().first():
        logger.info("Complaints already seeded. Skipping.")
        return

    logger.info("Seeding sample complaints...")

    sample_data = [
        {
            "title": "Leaking Pipe Under Washroom Sink",
            "description": "The main drainage pipe in room 204 washroom is leaking water onto the floor constantly.",
            "location": "Room 204, Floor 2",
            "hostel": "Hostel A",
            "status": ComplaintStatus.OPEN,
            "ai_category": "Plumbing",
            "ai_priority": ComplaintPriority.HIGH,
            "ai_department": "Maintenance",
        },
        {
            "title": "Broken Ceiling Fan Switch and Sparking",
            "description": "The wall socket sparks when turning on the ceiling fan. Potential fire hazard.",
            "location": "Room 302, Floor 3",
            "hostel": "Hostel A",
            "status": ComplaintStatus.FORWARDED,
            "ai_category": "Electrical",
            "ai_priority": ComplaintPriority.CRITICAL,
            "ai_department": "Maintenance",
        },
        {
            "title": "Study Table Drawer Track Broken",
            "description": "Wooden drawer track has splintered and the drawer cannot slide closed.",
            "location": "Room 105, Floor 1",
            "hostel": "Hostel A",
            "status": ComplaintStatus.IN_PROGRESS,
            "ai_category": "Furniture",
            "ai_priority": ComplaintPriority.MEDIUM,
            "ai_department": "Maintenance",
        },
        {
            "title": "Corridor Window Latch Fixed",
            "description": "Common corridor window latch was jammed open during high winds.",
            "location": "Common Corridor East Wing",
            "hostel": "Hostel A",
            "status": ComplaintStatus.RESOLVED,
            "ai_category": "Furniture",
            "ai_priority": ComplaintPriority.LOW,
            "ai_department": "Maintenance",
        },
    ]

    for item in sample_data:
        complaint = Complaint(
            title=item["title"],
            description=item["description"],
            location=item["location"],
            hostel=item["hostel"],
            status=item["status"],
            ai_category=item["ai_category"],
            ai_priority=item["ai_priority"],
            ai_department=item["ai_department"],
            supervisor_override=False,
            created_by=student.id,
            supervisor_id=supervisor.id,
        )
        session.add(complaint)
        await session.flush()

        # Add initial audit log
        session.add(
            AuditLog(
                action=AuditAction.TICKET_CREATED,
                performed_by=student.id,
                complaint_id=complaint.id,
                details={
                    "title": item["title"],
                    "location": item["location"],
                    "ai_category": item["ai_category"],
                    "ai_priority": item["ai_priority"].value,
                },
            )
        )

        if item["status"] in [
            ComplaintStatus.FORWARDED,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.RESOLVED,
        ]:
            session.add(
                AuditLog(
                    action=AuditAction.FORWARDED_TO_MAINTENANCE,
                    performed_by=supervisor.id,
                    complaint_id=complaint.id,
                    details={"status": "Forwarded"},
                )
            )

        if item["status"] in [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]:
            session.add(
                AuditLog(
                    action=AuditAction.STATUS_UPDATED,
                    performed_by=maintenance.id,
                    complaint_id=complaint.id,
                    details={"status": "InProgress", "note": "Technician dispatched on site"},
                )
            )

        if item["status"] == ComplaintStatus.RESOLVED:
            session.add(
                AuditLog(
                    action=AuditAction.STATUS_UPDATED,
                    performed_by=maintenance.id,
                    complaint_id=complaint.id,
                    details={
                        "status": "Resolved",
                        "resolution_note": "Replaced window latch and tested",
                    },
                )
            )

    await session.commit()
    logger.info("Sample complaints and audit logs seeded successfully.")


async def main() -> None:
    logger.info("Starting database seeding...")
    async with AsyncSessionLocal() as session:
        await seed_roles(session)
        user_map = await seed_users(session)
        await seed_sample_complaints(session, user_map)
    logger.info("Database seeding finished successfully.")


if __name__ == "__main__":
    asyncio.run(main())
