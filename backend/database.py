from pathlib import Path
import threading

from fastapi import HTTPException, Request
from sqlalchemy import URL, text
from sqlmodel import SQLModel, Session, create_engine

sqlite_file_name = "salsilauncher.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

_profile_engines = {0: engine}
_profile_lock = threading.Lock()
_profile_owner_file = Path(".salsilauncher_profile_owner")


def _create_tables(db_engine):
    SQLModel.metadata.create_all(db_engine)
    with db_engine.begin() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(collection)"))]
        if "favorite" not in cols:
            conn.execute(
                text(
                    "ALTER TABLE collection "
                    "ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT 0"
                )
            )


def create_db_and_tables():
    print("Tabela No Banco: ")
    print(SQLModel.metadata.tables.keys())
    _create_tables(engine)


def _engine_for_profile(profile_id: int):
    with _profile_lock:
        if profile_id in _profile_engines:
            return _profile_engines[profile_id]

        owner_id = None
        if _profile_owner_file.exists():
            try:
                owner_id = int(
                    _profile_owner_file.read_text(encoding="utf-8").strip()
                )
            except (OSError, ValueError):
                owner_id = None
        else:
            _profile_owner_file.write_text(str(profile_id), encoding="utf-8")
            owner_id = profile_id

        if owner_id == profile_id:
            profile_engine = engine
        else:
            profile_dir = Path(sqlite_file_name).resolve().parent / "profiles"
            profile_dir.mkdir(parents=True, exist_ok=True)
            profile_path = profile_dir / f"profile_{profile_id}.db"
            profile_engine = create_engine(
                URL.create("sqlite", database=str(profile_path)),
                echo=True,
                connect_args=connect_args,
            )

        _create_tables(profile_engine)
        _profile_engines[profile_id] = profile_engine
        return profile_engine


def get_session(request: Request):
    raw_id = request.headers.get("X-User-ID", "").strip()
    if raw_id:
        try:
            profile_id = int(raw_id)
        except ValueError:
            raise HTTPException(status_code=401, detail="Sessao local invalida")
        if profile_id <= 0:
            raise HTTPException(status_code=401, detail="Sessao local invalida")
        db_engine = _engine_for_profile(profile_id)
    else:
        db_engine = engine

    with Session(db_engine) as session:
        yield session
