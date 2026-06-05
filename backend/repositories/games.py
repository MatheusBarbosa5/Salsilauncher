from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional
from sqlalchemy.orm import selectinload

from models.games import Game, GameCreate, GameUpdate
from models.tags import Tag

def _get_game_eager(session: Session, game_id: int) -> Game | None:
    stmt = select(Game).where(Game.id == game_id).options(selectinload(Game.tags))
    return session.exec(stmt).first()


def sync_game_tag(session: Session, game: Game, tag_ids: list[int]):
    if not tag_ids:
        game.tags = []
        return

    stmt = select(Tag).where(Tag.id.in_(tag_ids))
    tags = session.exec(stmt).all()
    game.tags = list(tags)


def get_games(
    session: Session,
    q: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 25,
    offset: int = 0
) -> List[Game]:

    stmt = select(Game).options(selectinload(Game.tags))

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
        tag_set = {t.lower() for t in tags}
        games = [
            game for game in games
            if tag_set.issubset({t.name.lower() for t in (game.tags or [])})
        ]

    return games


# ← ALTERADO: usa _get_game_eager em vez de session.get
def get_game_by_id(session: Session, game_id: int) -> Game | None:
    return _get_game_eager(session, game_id)


# ← ALTERADO: remove session.expire e session.refresh, usa _get_game_eager
def create_game(session: Session, game_data: GameCreate) -> Game:
    data = game_data.model_dump(exclude={"tag_ids"})
    new_game = Game(**data)

    if game_data.tag_ids:
        stmt = select(Tag).where(Tag.id.in_(game_data.tag_ids))
        tags = list(session.exec(stmt).all())
        new_game.tags = tags

    session.add(new_game)
    session.commit()

    return _get_game_eager(session, new_game.id)


# ← ALTERADO: troca session.refresh por _get_game_eager
def update_game(session: Session, game_id: int, game_data: GameUpdate) -> Game | None:
    game_db = session.get(Game, game_id)

    if not game_db:
        return None

    update_dict = game_data.model_dump(exclude_unset=True)
    tag_ids = update_dict.pop("tag_ids", None)

    for key, value in update_dict.items():
        if hasattr(game_db, key):
            setattr(game_db, key, value)

    if tag_ids is not None:
        sync_game_tag(session, game_db, tag_ids)

    session.add(game_db)
    session.commit()

    return _get_game_eager(session, game_id)


def delete_game(session: Session, game_id: int) -> bool:
    game_db = session.get(Game, game_id)
    if not game_db:
        return False

    session.delete(game_db)
    session.commit()
    return True