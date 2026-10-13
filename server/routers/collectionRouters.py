from fastapi import APIRouter, Query, Response, HTTPException
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from core.security import DB, CurrentUser
from models.socialModels import Collection, CollectionGame
from models.gameModels import Game
from models.UsersModels import get_utc_now
from schemas.socialSchemas import CollectionCreate, CollectionUpdate
from repositories.socialRepository import owned, active_game, commit
from schemas.gameSchemas import GameResponse

router = APIRouter(prefix='/collections', tags=['Collections'])

def game_ids(session, collection_id):
    return list(session.exec(select(CollectionGame.game_id).where(CollectionGame.collection_id == collection_id).order_by(CollectionGame.game_id)).all())

def public(session, item):
    return {**item.model_dump(), 'game_ids': game_ids(session, item.id)}

def replace_games(session, collection_id, ids):
    for game_id in set(ids):
        active_game(session, game_id)
    session.exec(delete(CollectionGame).where(CollectionGame.collection_id == collection_id))
    for game_id in sorted(set(ids)):
        session.add(CollectionGame(collection_id=collection_id, game_id=game_id))

@router.get('/')
def list_collections(session: DB, user: CurrentUser, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    items = session.exec(select(Collection).where(Collection.user_id == user.id).order_by(Collection.id).offset(offset).limit(limit)).all()
    return [public(session, item) for item in items]

@router.post('/', status_code=201)
def create(data: CollectionCreate, session: DB, user: CurrentUser):
    for game_id in set(data.game_ids):
        active_game(session, game_id)
    item = Collection(user_id=user.id, **data.model_dump(exclude={'game_ids'}))
    session.add(item)
    session.flush()
    replace_games(session, item.id, data.game_ids)
    commit(session, item)
    return public(session, item)

@router.get('/{collection_id}')
def get_collection(collection_id: int, session: DB, user: CurrentUser):
    return public(session, owned(session, Collection, collection_id, user.id))

@router.get('/{collection_id}/games', response_model=list[GameResponse])
def get_games(collection_id: int, session: DB, user: CurrentUser, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    owned(session, Collection, collection_id, user.id)
    return session.exec(select(Game).join(CollectionGame, Game.id == CollectionGame.game_id).where(CollectionGame.collection_id == collection_id, Game.is_active == True).order_by(Game.id).offset(offset).limit(limit)).all()

@router.put('/{collection_id}')
@router.patch('/{collection_id}')
def update_collection(collection_id: int, data: CollectionUpdate, session: DB, user: CurrentUser):
    item = owned(session, Collection, collection_id, user.id)
    fields = data.model_dump(exclude_unset=True)
    if 'game_ids' in fields:
        replace_games(session, item.id, fields.pop('game_ids'))
    for key, value in fields.items():
        setattr(item, key, value)
    item.updated_at = get_utc_now()
    commit(session, item)
    return public(session, item)

@router.post('/{collection_id}/games/{game_id}')
def add_game(collection_id: int, game_id: int, session: DB, user: CurrentUser):
    item = owned(session, Collection, collection_id, user.id)
    active_game(session, game_id)
    if session.get(CollectionGame, (collection_id, game_id)) is None:
        session.add(CollectionGame(collection_id=collection_id, game_id=game_id))
        item.updated_at = get_utc_now()
        commit(session, item)
    return public(session, item)

@router.delete('/{collection_id}/games/{game_id}', status_code=204)
def remove_game(collection_id: int, game_id: int, session: DB, user: CurrentUser):
    item = owned(session, Collection, collection_id, user.id)
    session.exec(delete(CollectionGame).where(CollectionGame.collection_id == collection_id, CollectionGame.game_id == game_id))
    item.updated_at = get_utc_now()
    commit(session, item)
    return Response(status_code=204)

@router.delete('/{collection_id}', status_code=204)
def delete_collection(collection_id: int, session: DB, user: CurrentUser):
    item = owned(session, Collection, collection_id, user.id)
    session.exec(delete(CollectionGame).where(CollectionGame.collection_id == collection_id))
    session.delete(item)
    session.commit()
    return Response(status_code=204)
