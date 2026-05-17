from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional

from models.games import Game, GameCreate, GameUpdate

def get_all_games(session: Session, q: Optional[str] = None, tags: Optional[str] = None, limit: int = 25, offset: int = 0):
    stmt = select(Game)

    if q:
        q_lower = f"%{q.lower()}%"
        stmt = stmt.where(or_(Game.nome.ilike(q_lower), Game.descricao.ilike(q_lower)))

    # Busca no banco de dados
    games = session.exec(stmt).all()

    if tags:
        tags_requisitadas = {t.strip().lower() for t in tags.split(",")}
        games = [
            game for game in games
            if tags_requisitadas.issubset({t.lower() for t in game.tags})
        ]

    return games[offset : offset + limit]

def get_game_by_id(session: Session, game_id: int):
    return session.get(Game, game_id)

def create_game(session: Session, game_data: GameCreate):
    novo_game = Game(**game_data.model_dump())
    session.add(novo_game)
    session.commit()
    session.refresh(novo_game)
    return novo_game

def update_game(session: Session, game_id: int, game_data: GameUpdate):
    game_db = session.get(Game, game_id)
    if not game_db:
        return None

    # Atualiza apenas os campos que foram enviados
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