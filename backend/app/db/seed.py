import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine, AsyncSessionLocal
from app.db.models import Role
from app.domain.enums import UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_roles(session: AsyncSession) -> None:
    """
    Seeds the database with the three default static roles.
    Checks if they exist before inserting to make the script idempotent.
    """
    default_roles = [UserRole.STUDENT, UserRole.HOSTEL_SUPERVISOR, UserRole.MAINTENANCE_OFFICE]

    for role_name in default_roles:
        # Check if the role already exists
        result = await session.execute(select(Role).where(Role.name == role_name.value))
        existing_role = result.scalars().first()

        if not existing_role:
            logger.info(f"Seeding role: {role_name.value}")
            new_role = Role(name=role_name.value)
            session.add(new_role)
        else:
            logger.info(f"Role {role_name.value} already exists. Skipping.")

    await session.commit()
    logger.info("Role seeding complete.")

async def main() -> None:
    """
    Main entry point for the seeding mechanism.
    """
    logger.info("Starting database seeding...")
    async with AsyncSessionLocal() as session:
        await seed_roles(session)
    logger.info("Database seeding finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())
