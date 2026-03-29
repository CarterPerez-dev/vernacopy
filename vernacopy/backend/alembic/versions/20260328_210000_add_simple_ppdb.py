"""add simple_ppdb table

Revision ID: 20260328_210000
Revises: 20260328_200000
Create Date: 2026-03-28 21:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20260328_210000'
down_revision: Union[str, None] = '20260328_200000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'simple_ppdb',
        sa.Column('word', sa.Text(), nullable=False),
        sa.Column('simpler_words', postgresql.ARRAY(sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint('word', name='pk_simple_ppdb'),
    )


def downgrade() -> None:
    op.drop_table('simple_ppdb')
