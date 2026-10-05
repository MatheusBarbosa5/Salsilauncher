from datetime import timezone
from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.models.entities import Game, GameSession
from app.schemas import SessionCreate
from app.security import DB, CurrentUser
from app.repository.library import owned

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("/")
def list_sessions(session: DB, user: CurrentUser, game_id: int | None = None, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(GameSession).where(GameSession.owner_id == user.id)
    if game_id is not None:
        owned(session, Game, game_id, user.id)
        stmt = stmt.where(GameSession.game_id == game_id)
    return [s.model_dump(exclude={"owner_id"}) for s in session.exec(stmt.order_by(GameSession.id).offset(offset).limit(limit)).all()]

def compare(existing, data):
    def utc(value):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
    if existing.game_id != data.game_id or utc(existing.iniciada_em) != utc(data.iniciada_em) or utc(existing.encerrada_em) != utc(data.encerrada_em):
        raise HTTPException(409, "client_session_id já usado para outra sessão")
    return existing.model_dump(exclude={"owner_id"})

@router.post("/")
def complete_session(data: SessionCreate, session: DB, user: CurrentUser):
    game = owned(session, Game, data.game_id, user.id)
    key = str(data.client_session_id)
    stmt = select(GameSession).where(GameSession.owner_id == user.id, GameSession.client_session_id == key)
    existing = session.exec(stmt).first()
    if existing:
        return compare(existing, data)
    seconds = int((data.encerrada_em - data.iniciada_em).total_seconds())
    record = GameSession(owner_id=user.id, game_id=game.id, client_session_id=key, iniciada_em=data.iniciada_em.astimezone(timezone.utc), encerrada_em=data.encerrada_em.astimezone(timezone.utc), duracao_segundos=seconds)
    session.add(record)
    try:
        session.flush()
        session.exec(update(Game).where(Game.id == game.id, Game.owner_id == user.id).values(play_time=Game.play_time + seconds))
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = session.exec(stmt).first()
        if existing:
            return compare(existing, data)
        raise HTTPException(409, "Não foi possível registrar a sessão")
    session.refresh(record)
    return record.model_dump(exclude={"owner_id"})
