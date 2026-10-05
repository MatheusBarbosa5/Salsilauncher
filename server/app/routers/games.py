from fastapi import APIRouter, Query, HTTPException, Response
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.models.entities import Game, Tag, GameTagLink, CollectionGameLink, GameSession, UserRating
from app.schemas import GameCreate, GameUpdate
from app.security import DB, CurrentUser
from app.repository.library import owned, validate_ids, game_public

router = APIRouter(prefix="/games", tags=["Games"])

@router.get("/")
def list_games(session: DB, user: CurrentUser, q: str | None = Query(None, max_length=150), limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(Game).where(Game.owner_id == user.id, Game.is_active == True)
    if q:
        stmt = stmt.where(Game.title.contains(q, autoescape=True))
    games = session.exec(stmt.order_by(Game.id).offset(offset).limit(limit)).all()
    return [game_public(session, g) for g in games]

@router.post("/", status_code=201)
def create_game(data: GameCreate, session: DB, user: CurrentUser):
    tags = validate_ids(session, Tag, data.tag_ids, user.id)
    game = Game(**data.model_dump(exclude={"tag_ids"}), owner_id=user.id)
    session.add(game)
    try:
        session.flush()
        for t in tags:
            session.add(GameTagLink(game_id=game.id, tag_id=t.id))
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "Este jogo Steam já existe na sua biblioteca")
    session.refresh(game)
    return game_public(session, game)

@router.get("/{game_id}")
def get_game(game_id: int, session: DB, user: CurrentUser):
    return game_public(session, owned(session, Game, game_id, user.id))

@router.patch("/{game_id}")
@router.put("/{game_id}")
def update_game(game_id: int, data: GameUpdate, session: DB, user: CurrentUser):
    game = owned(session, Game, game_id, user.id)
    fields = data.model_dump(exclude_unset=True)
    if "tag_ids" in fields:
        tags = validate_ids(session, Tag, fields.pop("tag_ids"), user.id)
        session.exec(delete(GameTagLink).where(GameTagLink.game_id == game.id))
        for t in tags:
            session.add(GameTagLink(game_id=game.id, tag_id=t.id))
    for key, value in fields.items():
        setattr(game, key, value)
    session.add(game)
    session.commit()
    session.refresh(game)
    return game_public(session, game)

@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, session: DB, user: CurrentUser):
    game = owned(session, Game, game_id, user.id)
    for model in (GameTagLink, CollectionGameLink, GameSession, UserRating):
        session.exec(delete(model).where(model.game_id == game_id))
    session.delete(game)
    session.commit()
    return Response(status_code=204)
