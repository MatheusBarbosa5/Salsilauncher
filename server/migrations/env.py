from alembic import context
from sqlmodel import SQLModel
from app.config import get_settings
from app.database import make_engine
from app.models import entities  # registra as tabelas

target_metadata = SQLModel.metadata

def run_offline():
    context.configure(url=get_settings().database_url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"}, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_online():
    engine = make_engine(get_settings().database_url)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True, render_as_batch=engine.dialect.name == "sqlite")
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()

if context.is_offline_mode():
    run_offline()
else:
    run_online()
