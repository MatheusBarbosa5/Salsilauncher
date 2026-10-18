from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text

# Nome do arquivo do banco de dados que será criado
sqlite_file_name = "salsilauncher.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

def create_db_and_tables():
    print("Tabela No Banco: ")
    print(SQLModel.metadata.tables.keys())

    SQLModel.metadata.create_all(engine)
    _add_missing_columns()

# create_all não altera tabelas existentes; adiciona colunas novas no SQLite.
def _add_missing_columns():
    with engine.begin() as conn:
        cols = [r[1] for r in conn.execute(text("PRAGMA table_info(collection)"))]
        if "favorite" not in cols:
            conn.execute(
                text("ALTER TABLE collection ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT 0")
            )

def get_session():
# Gera uma sessão do banco para ser injetada nos endpoints
    with Session(engine) as session:
        yield session