from datetime import timezone
from fastapi import APIRouter, Query, Response, HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from core.security import DB, CurrentUser
from models.socialModels import PlaySession
from schemas.socialSchemas import PlaySessionCreate, PlaySessionEnd
from repositories.socialRepository import owned, active_game, commit

router = APIRouter(prefix='/play-sessions', tags=['Play Sessions'])

def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

@router.get('/')
def list_sessions(session: DB, user: CurrentUser, game_id: int | None = None, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(PlaySession).where(PlaySession.user_id == user.id)
    if game_id is not None:
        stmt = stmt.where(PlaySession.game_id == game_id)
    return session.exec(stmt.order_by(PlaySession.id.desc()).offset(offset).limit(limit)).all()

@router.post('/', status_code=201)
def start(data: PlaySessionCreate, session: DB, user: CurrentUser):
    active_game(session, data.game_id)
    started = utc(data.started_at)
    ended = utc(data.ended_at) if data.ended_at else None
    client_id = str(data.client_session_id) if data.client_session_id else None
    stmt = select(PlaySession).where(PlaySession.user_id == user.id, PlaySession.client_session_id == client_id)
    def identical(record):
        if record.game_id != data.game_id or utc(record.started_at) != started or (utc(record.ended_at) if record.ended_at else None) != ended:
            raise HTTPException(409, "Identificação já usada para outra sessão")
        return record
    if client_id:
        existing = session.exec(stmt).first()
        if existing:
            return identical(existing)
    item = PlaySession(user_id=user.id, game_id=data.game_id, client_session_id=client_id, started_at=started, ended_at=ended, duration_seconds=int((ended-started).total_seconds()) if ended else None)
    session.add(item)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = session.exec(stmt).first() if client_id else None
        if existing:
            return identical(existing)
        raise HTTPException(409, "Sessão alterada em outra requisição")
    session.refresh(item)
    return item

@router.get('/{session_id}')
def get_play_session(session_id: int, session: DB, user: CurrentUser):
    return owned(session, PlaySession, session_id, user.id)

@router.patch('/{session_id}/end')
def end(session_id: int, data: PlaySessionEnd, session: DB, user: CurrentUser):
    item = owned(session, PlaySession, session_id, user.id)
    ended = utc(data.ended_at)
    if ended < utc(item.started_at):
        raise HTTPException(422, 'ended_at deve ser posterior ou igual a started_at')
    if item.ended_at is not None:
        if utc(item.ended_at) != ended:
            raise HTTPException(409, 'Sessão já encerrada com outro horário')
        return item
    seconds = int((ended - utc(item.started_at)).total_seconds())
    result = session.exec(update(PlaySession).where(PlaySession.id == item.id, PlaySession.user_id == user.id, PlaySession.ended_at == None).values(ended_at=ended, duration_seconds=seconds).execution_options(synchronize_session=False))
    if result.rowcount != 1:
        session.rollback()
        raise HTTPException(409, 'Sessão encerrada em outra requisição')
    session.commit()
    session.refresh(item)
    return item

@router.delete('/{session_id}', status_code=204)
def delete_play_session(session_id: int, session: DB, user: CurrentUser):
    item = owned(session, PlaySession, session_id, user.id)
    session.delete(item)
    session.commit()
    return Response(status_code=204)
