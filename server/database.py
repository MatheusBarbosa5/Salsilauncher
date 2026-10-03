from pathlib import Path

from sqlmodel import SQLModel, Session, create_engine

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "salsilauncher-server.db"
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    # Importa os modelos antes do create_all para registrar as tabelas no metadata.
    from models.gameModels import Game

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
