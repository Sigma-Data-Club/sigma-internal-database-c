"""baseline after manual changes

Revision ID: 4a2d28081079
Revises: ead9b0c42223
Create Date: 2026-02-25 20:27:32.232427

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a2d28081079'
down_revision: Union[str, Sequence[str], None] = 'ead9b0c42223'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
