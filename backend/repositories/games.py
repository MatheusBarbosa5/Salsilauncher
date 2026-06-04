from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional, Set

from models.games import Game, GameCreate, GameUpdate

# Buscar todos os jogos, com ou sem filtro
def get_games(
    session: Session,
    q: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 25,
    offset: int = 0
) -> List[Game]:

    stmt = select(Game)

    if q:
        q_like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                Game.title.ilike(q_like),
                Game.description.ilike(q_like)
            )
        )

    stmt = stmt.offset(offset).limit(limit)

    games = session.exec(stmt).all()

    if tags:
        tag_set = set(t.lower() for t in tags)

        games = [
            game for game in games
            if tag_set.issubset(
                set((t.lower() for t in (game.tags or [])))
            )
        ]

    return games

# Bucar jogo com base no ID
def get_game_by_id(session: Session, game_id: int):
    return session.get(Game, game_id)

# Criar Jogo
def create_game(session: Session, game_data: GameCreate) -> Game:
    new_game = Game(**game_data.model_dump())

    session.add(new_game)
    session.commit()
    session.refresh(new_game)

    return new_game

def update_game(session: Session, game_id: int, game_data: GameUpdate):
    game_db = session.get(Game, game_id)

    if not game_db:
        return None

    update_dict = game_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(game_db, key, value)

    session.add(game_db)
    session.commit()
    session.refresh(game_db)

    return game_db

def delete_game(session: Session, game_id: int):
    game_db = session.get(Game, game_id)
    if not game_db:
        return False

    session.delete(game_db)
    session.commit()
    return True