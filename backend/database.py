from sqlmodel import SQLModel, create_engine, Session

# Nome do arquivo do banco de dados que será criado
sqlite_file_name = "salsilauncher.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

def create_db_and_tables():
    print("Tabela No Banco: ")
    print(SQLModel.metadata.tables.keys())

    SQLModel.metadata.create_all(engine)

def get_session():
# Gera uma sessão do banco para ser injetada nos endpoints
    with Session(engine) as session:
        yield session