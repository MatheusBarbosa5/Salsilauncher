from sqlmodel import Session, select
# from sqlalchemy import or_
# from typing import List, Optional

from models.game_session import SessaoJogo, SessaoJogoCreate


def create_session(session: Session, data: SessaoJogoCreate):
    sessao = SessaoJogo(**data.model_dump())
    session.add(sessao)
    session.commit()
    session.refresh(sessao)
    return sessao

def get_all_active_sessions(session: Session):
    sessoes = session.exec(
        select(SessaoJogo)
        .where(SessaoJogo.ativa == True)
        ).all()
    return sessoes

def get_active_sessions_by_game(session: Session, jogo_id: int):
    return session.exec(
        select(SessaoJogo)
        .where(
            SessaoJogo.jogo_id == jogo_id,
            SessaoJogo.ativa == True
        )
    ).first()