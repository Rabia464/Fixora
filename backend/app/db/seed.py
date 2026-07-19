import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.db.models import Role, User
from app.domain.enums import UserRole


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dev/demo accounts — passwordless login uses email only.
# Student + supervisor share Hostel A so routing works end-to-end.
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
    """
    Seeds the database with the three default static roles.
    Checks if they exist before inserting to make the script idempotent.
    """
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


async def seed_users(session: AsyncSession) -> None:
    """
    Seeds demo users for each role so login works in local/dev environments.
    Idempotent: skips emails that already exist.
    """
    for entry in SEED_USERS:
        result = await session.execute(select(User).where(User.email == entry["email"]))
        if result.scalars().first():
            logger.info(f"User {entry['email']} already exists. Skipping.")
            continue

        role_result = await session.execute(select(Role).where(Role.name == entry["role"].value))
        role = role_result.scalars().first()
        if not role:
            raise RuntimeError(f"Role '{entry['role'].value}' not found. Seed roles first.")

        logger.info(f"Seeding user: {entry['email']} ({entry['role'].value})")
        session.add(
            User(
                email=entry["email"],
                full_name=entry["full_name"],
                hostel=entry["hostel"],
                role_id=role.id,
            )
        )

    await session.commit()
    logger.info("User seeding complete.")


async def main() -> None:
    """
    Main entry point for the seeding mechanism.
    """
    logger.info("Starting database seeding...")
    async with AsyncSessionLocal() as session:
        await seed_roles(session)
        await seed_users(session)
    logger.info("Database seeding finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())
