from sqlmodel import Session, select
# from sqlalchemy import or_
# from typing import List, Optional

from models.game_session import SessaoGame, SessaoGameCreate


def create_session(session: Session, data: SessaoGameCreate):
    sessao = SessaoGame(**data.model_dump())
    session.add(sessao)
    session.commit()
    session.refresh(sessao)
    return sessao

def get_all_active_sessions(session: Session):
    sessoes = session.exec(
        select(SessaoGame)
        .where(SessaoGame.ativa == True)
        ).all()
    return sessoes

def get_active_sessions_by_game(session: Session, game_id: int):
    return session.exec(
        select(SessaoGame)
        .where(
            SessaoGame.game_id == game_id,
            SessaoGame.ativa == True
        )
    ).first()