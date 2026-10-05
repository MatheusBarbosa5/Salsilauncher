from fastapi import APIRouter, Query, Response, HTTPException
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.models.entities import Collection, CollectionGameLink, Game
from app.schemas import CollectionCreate, CollectionUpdate
from app.security import DB, CurrentUser
from app.repository.library import owned, validate_ids, game_public

router = APIRouter(prefix="/collections", tags=["Collections"])

def public(collection):
    return collection.model_dump(exclude={"owner_id"})

def replace_games(session, collection_id, games):
    session.exec(delete(CollectionGameLink).where(CollectionGameLink.collection_id == collection_id))
    for game in games:
        session.add(CollectionGameLink(collection_id=collection_id, game_id=game.id))

@router.get("/")
def list_collections(session: DB, user: CurrentUser, q: str | None = Query(None, max_length=150), limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(Collection).where(Collection.owner_id == user.id)
    if q:
        stmt = stmt.where(Collection.title.contains(q, autoescape=True))
    return [public(c) for c in session.exec(stmt.order_by(Collection.id).offset(offset).limit(limit)).all()]

@router.post("/", status_code=201)
def create_collection(data: CollectionCreate, session: DB, user: CurrentUser):
    games = validate_ids(session, Game, data.game_ids, user.id)
    collection = Collection(title=data.title, cover=data.cover, owner_id=user.id)
    session.add(collection)
    session.flush()
    replace_games(session, collection.id, games)
    session.commit()
    session.refresh(collection)
    return public(collection)

@router.get("/{collection_id}")
def collection_games(collection_id: int, session: DB, user: CurrentUser):
    owned(session, Collection, collection_id, user.id)
    games = session.exec(select(Game).join(CollectionGameLink, Game.id == CollectionGameLink.game_id).where(CollectionGameLink.collection_id == collection_id, Game.owner_id == user.id, Game.is_active == True).order_by(Game.id)).all()
    return [game_public(session, g) for g in games]

@router.put("/{collection_id}")
@router.patch("/{collection_id}")
def update_collection(collection_id: int, data: CollectionUpdate, session: DB, user: CurrentUser):
    collection = owned(session, Collection, collection_id, user.id)
    fields = data.model_dump(exclude_unset=True)
    if "game_ids" in fields:
        games = validate_ids(session, Game, fields.pop("game_ids"), user.id)
        replace_games(session, collection_id, games)
    for key, value in fields.items():
        setattr(collection, key, value)
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return public(collection)

@router.delete("/{collection_id}", status_code=204)
def delete_collection(collection_id: int, session: DB, user: CurrentUser):
    collection = owned(session, Collection, collection_id, user.id)
    session.exec(delete(CollectionGameLink).where(CollectionGameLink.collection_id == collection_id))
    session.delete(collection)
    session.commit()
    return Response(status_code=204)

@router.post("/{collection_id}/games/{game_id}")
def add_game(collection_id: int, game_id: int, session: DB, user: CurrentUser):
    collection = owned(session, Collection, collection_id, user.id)
    owned(session, Game, game_id, user.id)
    if session.get(CollectionGameLink, (collection.id, game_id)) is None:
        session.add(CollectionGameLink(collection_id=collection.id, game_id=game_id))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(409, "Coleção alterada em outra requisição; tente novamente")
    return {"message": "Jogo adicionado à coleção"}

@router.delete("/{collection_id}/games/{game_id}", status_code=204)
def remove_game(collection_id: int, game_id: int, session: DB, user: CurrentUser):
    owned(session, Collection, collection_id, user.id)
    owned(session, Game, game_id, user.id)
    session.exec(delete(CollectionGameLink).where(CollectionGameLink.collection_id == collection_id, CollectionGameLink.game_id == game_id))
    session.commit()
    return Response(status_code=204)
