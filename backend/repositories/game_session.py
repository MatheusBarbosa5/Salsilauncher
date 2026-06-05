from sqlmodel import Session, select
# from sqlalchemy import or_
# from typing import List, Optional

from models.game_session import GameSession, GameSessionCreate


def create_session(session: Session, data: GameSessionCreate):
    sessao = GameSession(**data.model_dump())
    session.add(sessao)
    session.commit()
    session.refresh(sessao)
    return sessao

def get_all_active_sessions(session: Session):
    sessoes = session.exec(
        select(GameSession)
        .where(GameSession.ativa == True)
        ).all()
    return sessoes

def get_active_sessions_by_game(session: Session, game_id: int):
    return session.exec(
        select(GameSession)
        .where(
            GameSession.game_id == game_id,
            GameSession.ativa == True
        )
    ).first()

