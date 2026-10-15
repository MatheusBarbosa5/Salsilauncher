from typing import Optional
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from models.gameModels import Game, GameCreate, GameUpdate
from models.UsersModels import get_utc_now

def commit(session, game):
    session.add(game)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, 'Steam AppID já cadastrado ou catálogo alterado em outra requisição')
    session.refresh(game)
    return game

def get_games(session: Session, q: Optional[str] = None, limit: int = 25, offset: int = 0):
    stmt = select(Game).where(Game.is_active.is_(True))
    if q:
        stmt = stmt.where(or_(Game.title.icontains(q.strip(), autoescape=True), Game.description.icontains(q.strip(), autoescape=True)))
    return list(session.exec(stmt.order_by(Game.title).offset(offset).limit(limit)).all())

def get_game_by_id(session, game_id):
    return session.get(Game, game_id)

def get_game_by_steam_appid(session, steam_appid):
    return session.exec(select(Game).where(Game.steam_appid == steam_appid)).first()

def create_game(session, game_data):
    if game_data.steam_appid is not None:
        existing = get_game_by_steam_appid(session, game_data.steam_appid)
        if existing:
            for key, value in game_data.model_dump(exclude_unset=True).items():
                setattr(existing, key, value)
            existing.is_active = True
            existing.updated_at = get_utc_now()
            return commit(session, existing)
    return commit(session, Game(**game_data.model_dump()))

def update_game(session, game_id, game_data):
    game = session.get(Game, game_id)
    if not game:
        return None
    for key, value in game_data.model_dump(exclude_unset=True).items():
        setattr(game, key, value)
    game.updated_at = get_utc_now()
    return commit(session, game)

def delete_game(session, game_id):
    game = session.get(Game, game_id)
    if not game:
        return False
    game.is_active = False
    game.updated_at = get_utc_now()
    commit(session, game)
    return True
