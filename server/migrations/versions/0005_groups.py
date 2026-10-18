"""Grupos de conversa: grupos, membros e mensagens"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
revision = '0005'
down_revision = '0004'
branch_labels = depends_on = None

def upgrade():
    op.create_table('groups',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('groups', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_groups_owner_id'), ['owner_id'], unique=False)

    op.create_table('group_members',
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('joined_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('group_id', 'user_id')
    )
    with op.batch_alter_table('group_members', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_group_members_user_id'), ['user_id'], unique=False)

    op.create_table('group_messages',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('sender_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('sent_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('group_messages', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_group_messages_group_id'), ['group_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_group_messages_sender_id'), ['sender_id'], unique=False)

def downgrade():
    op.drop_table('group_messages')
    op.drop_table('group_members')
    op.drop_table('groups')
