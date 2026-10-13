"""Corrige senhas em texto puro criadas pela versão enviada e normaliza identidades."""
from alembic import op
import sqlalchemy as sa
from pwdlib import PasswordHash
revision = '0003'
down_revision = '0002'
branch_labels = depends_on = None

def upgrade():
    connection = op.get_bind()
    users = sa.table('users', sa.column('id', sa.Integer()), sa.column('email', sa.String()), sa.column('username', sa.String()), sa.column('password_hash', sa.String()))
    rows = list(connection.execute(sa.select(users)).mappings())
    for column in ('email', 'username'):
        normalized = [row[column].lower() for row in rows]
        if len(normalized) != len(set(normalized)):
            raise RuntimeError(f'Identidades duplicadas ao normalizar {column}; resolva a duplicidade antes de migrar')
    hasher = PasswordHash.recommended()
    for row in rows:
        stored = row['password_hash']
        if not stored.startswith(('$argon2', '$2a$', '$2b$', '$2y$')):
            stored = hasher.hash(stored)
        connection.execute(sa.update(users).where(users.c.id == row['id']).values(email=row['email'].lower(), username=row['username'].lower(), password_hash=stored))

def downgrade():
    # Hash de senha é irreversível; nunca restaurar texto puro.
    pass
