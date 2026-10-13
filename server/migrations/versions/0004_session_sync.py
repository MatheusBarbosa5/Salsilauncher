"""Identificador opcional para sincronização sem duplicar sessões."""
from alembic import op
import sqlalchemy as sa
revision = '0004'
down_revision = '0003'
branch_labels = depends_on = None

def upgrade():
    with op.batch_alter_table('play_sessions') as batch:
        batch.add_column(sa.Column('client_session_id', sa.String(36), nullable=True))
        batch.create_unique_constraint('uq_play_sessions_client', ['user_id', 'client_session_id'])

def downgrade():
    with op.batch_alter_table('play_sessions') as batch:
        batch.drop_constraint('uq_play_sessions_client', type_='unique')
        batch.drop_column('client_session_id')
