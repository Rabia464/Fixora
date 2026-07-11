"""Add complaint hostel column

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-11 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("complaints", sa.Column("hostel", sa.String(length=100), nullable=True))
    op.execute(
        """
        UPDATE complaints c
        SET hostel = u.hostel
        FROM users u
        WHERE c.created_by = u.id AND u.hostel IS NOT NULL
        """
    )
    op.execute("UPDATE complaints SET hostel = 'Unknown' WHERE hostel IS NULL")
    op.alter_column("complaints", "hostel", nullable=False)
    op.create_index(op.f("ix_complaints_hostel"), "complaints", ["hostel"], unique=False)
    op.create_index("ix_complaints_hostel_status", "complaints", ["hostel", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_complaints_hostel_status", table_name="complaints")
    op.drop_index(op.f("ix_complaints_hostel"), table_name="complaints")
    op.drop_column("complaints", "hostel")
