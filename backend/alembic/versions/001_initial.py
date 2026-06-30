"""initial migration

Revision ID: 001
Revises: 
Create Date: 2026-06-26 17:00:00.000000

"""
from typing import Sequence, Optional
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Optional[str] = None
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None

def upgrade() -> None:
    # 1. Create Enums for PostgreSQL compatibility
    # Note: checkfirst=True is used to handle existing types safely
    user_role = sa.Enum('STUDENT', 'STAFF', 'ADMIN', name='userrole')
    ticket_category = sa.Enum('ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'HOUSEKEEPING', 'INTERNET', 'OTHER', name='ticketcategory')
    ticket_priority = sa.Enum('LOW', 'MEDIUM', 'HIGH', name='ticketpriority')
    ticket_status = sa.Enum('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'REOPENED', name='ticketstatus')

    # Bind and create types
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        user_role.create(bind, checkfirst=True)
        ticket_category.create(bind, checkfirst=True)
        ticket_priority.create(bind, checkfirst=True)
        ticket_status.create(bind, checkfirst=True)

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', user_role, nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. Create student_profiles table
    op.create_table(
        'student_profiles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('room_number', sa.String(length=50), nullable=False),
        sa.Column('hostel_block', sa.String(length=50), nullable=False),
        sa.Column('contact_number', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 4. Create staff_profiles table
    op.create_table(
        'staff_profiles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('specialization', ticket_category, nullable=False),
        sa.Column('availability', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 5. Create complaints table
    op.create_table(
        'complaints',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', ticket_category, nullable=False),
        sa.Column('priority', ticket_priority, nullable=False),
        sa.Column('status', ticket_status, nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('staff_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['student_profiles.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['staff_id'], ['staff_profiles.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Create media_attachments table
    op.create_table(
        'media_attachments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('file_url', sa.String(length=512), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. Create comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. Create feedbacks table
    op.create_table(
        'feedbacks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', 'complaint_id')
    )

def downgrade() -> None:
    # Drop tables in reverse order of creation
    op.drop_table('feedbacks')
    op.drop_table('comments')
    op.drop_table('media_attachments')
    op.drop_table('complaints')
    op.drop_table('staff_profiles')
    op.drop_table('student_profiles')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    # Drop custom enum types for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute('DROP TYPE userrole')
        op.execute('DROP TYPE ticketcategory')
        op.execute('DROP TYPE ticketpriority')
        op.execute('DROP TYPE ticketstatus')
