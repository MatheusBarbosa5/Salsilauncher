from alembic import context
from sqlmodel import SQLModel
from database import engine
import models

def run():
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=SQLModel.metadata, render_as_batch=engine.dialect.name == 'sqlite', compare_type=True)
        with context.begin_transaction():
            context.run_migrations()
if context.is_offline_mode():
    raise RuntimeError('Execute migrações com conexão ao banco; esta versão importa tabelas legadas quando presentes')
else:
    run()
