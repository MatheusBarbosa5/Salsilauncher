from sqlalchemy import event
from sqlmodel import Session, create_engine
from fastapi import Request

def make_engine(url: str):
    sqlite = url.startswith("sqlite")
    engine = create_engine(url, connect_args={"check_same_thread": False} if sqlite else {}, pool_pre_ping=True)
    if sqlite:
        @event.listens_for(engine, "connect")
        def enable_foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
    return engine

def get_session(request: Request):
    with Session(request.app.state.engine) as session:
        yield session
