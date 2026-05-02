"""embed feedback into event_application

Revision ID: 6a0981a0e75c
Revises: 4a2d28081079
Create Date: 2026-02-27 16:42:08.943946

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a0981a0e75c'
down_revision: Union[str, Sequence[str], None] = '4a2d28081079'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
