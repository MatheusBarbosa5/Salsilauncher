from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from models.UsersModels import User
from models.gameModels import Game
from models.socialModels import Friendship

def commit(session, record):
    session.add(record)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, 'Registro duplicado ou alterado em outra requisição')
    session.refresh(record)
    return record

def owned(session, model, item_id, user_id):
    record = session.exec(select(model).where(model.id == item_id, model.user_id == user_id)).first()
    if record is None:
        raise HTTPException(404, 'Registro não encontrado')
    return record

def active_game(session, game_id):
    game = session.get(Game, game_id)
    if game is None or not game.is_active:
        raise HTTPException(404, 'Jogo não encontrado')
    return game

def active_user(session, user_id):
    user = session.get(User, user_id)
    if user is None or not user.is_active or user.is_banned:
        raise HTTPException(404, 'Usuário não encontrado')
    return user

def pair_key(a, b):
    return f'{min(a,b)}:{max(a,b)}'

def friendship_pair(session, a, b):
    return session.exec(select(Friendship).where(Friendship.pair_key == pair_key(a,b))).first()
