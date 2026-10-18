from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
# from sqlalchemy import or_
# from typing import List, Optional

from models.game_session import GameSession, GameSessionCreate
from models.games import Game


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


def get_recently_played_games(session: Session, limit: int = 8) -> list[Game]:
    """Returns each active game once, ordered by its most recent launch."""
    seen_game_ids: set[int] = set()
    games: list[Game] = []
    rows = session.exec(
        select(GameSession)
        .order_by(GameSession.iniciada_em.desc())
    ).all()
    for row in rows:
        if row.game_id in seen_game_ids:
            continue
        game = session.exec(
            select(Game)
            .where(Game.id == row.game_id, Game.is_active == True)
            .options(selectinload(Game.tags))
        ).first()
        if game:
            games.append(game)
            seen_game_ids.add(row.game_id)
        if len(games) >= limit:
            break
    return games

