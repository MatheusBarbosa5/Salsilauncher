"""Baseline do schema enviado: cria bancos novos ou adota as duas tabelas antigas."""
from alembic import op
import sqlalchemy as sa
revision = '0001'
down_revision = None
branch_labels = depends_on = None

def upgrade():
    tables = sa.inspect(op.get_bind()).get_table_names()
    if 'users' not in tables:
        op.create_table('users',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('username', sa.String(80), nullable=False),
            sa.Column('email', sa.String(255), nullable=False),
            sa.Column('password_hash', sa.String(255), nullable=False),
            sa.Column('display_name', sa.String(100)),
            sa.Column('avatar_url', sa.String(512)),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('is_banned', sa.Boolean(), nullable=False),
            sa.Column('language', sa.String(10), nullable=False),
            sa.Column('theme', sa.String(20), nullable=False),
            sa.Column('last_login_at', sa.DateTime()),
            sa.Column('last_activity_at', sa.DateTime()),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False))
        op.create_index('ix_users_username', 'users', ['username'], unique=True)
        op.create_index('ix_users_email', 'users', ['email'], unique=True)
    if 'game' not in tables and 'games' not in tables:
        op.create_table('game',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('steam_appid', sa.Integer()),
            sa.Column('description', sa.String()),
            sa.Column('cover', sa.String()),
            sa.Column('background', sa.String()),
            sa.Column('extra_images', sa.JSON()),
            sa.Column('genres', sa.JSON()),
            sa.Column('is_active', sa.Boolean(), nullable=False))
        op.create_index('ix_game_id', 'game', ['id'])
        op.create_index('ix_game_title', 'game', ['title'])
        op.create_index('ix_game_steam_appid', 'game', ['steam_appid'], unique=True)

def downgrade():
    # A baseline pode ter adotado tabelas que já existiam. Não destruir dados legados.
    raise RuntimeError('A baseline não pode ser removida automaticamente; restaure o backup para voltar à versão original')
