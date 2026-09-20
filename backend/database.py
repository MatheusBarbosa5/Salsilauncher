import os
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://salsi:salsi123@localhost:5432/salsilauncher"
)

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    print("Tabelas no banco:")
    print(SQLModel.metadata.tables.keys())
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session