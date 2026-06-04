from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional

from models.collections import Collection, CollectionCreate, CollectionUpdate
from models.games import Game, CollectionGameLink

# Obter Coleções
def get_collections(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0
):
    stmt = select(Collection)

    if q:
        q_like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                Collection.title.ilike(q_like),
                Collection.description.ilike(q_like)
            )
        )

    stmt = stmt.offset(offset).limit(limit)

    return session.exec(stmt).all()

# Criar coleções
def create_collection(
    session: Session,
    collection_data: CollectionCreate
) -> Collection:

    games = session.exec(
        select(Game).where(
            Game.id.in_(collection_data.game_ids)
        )
    ).all()

    if len(games) != len(collection_data.game_ids):
        raise ValueError(
            "Um ou mais jogos informados não existem. (rafapi: bl)"
        )

    new_collection = Collection(
        title=collection_data.title,
        games=games
    )

    session.add(new_collection)
    session.commit()
    session.refresh(new_collection)

    return new_collection

# Atualzair coleção
def update_collection(
    session: Session,
    collection_id: int,
    collection_data: CollectionUpdate
) -> Collection | None:

    collection_db = session.get(
        Collection,
        collection_id
    )

    if collection_db is None:
        return None

    games = session.exec(
        select(Game).where(
            Game.id.in_(collection_data.game_ids)
        )
    ).all()

    if len(games) != len(collection_data.game_ids):
        raise ValueError(
            "Um ou mais jogos informados não existem. (rafapi: blz)"
        )

    collection_db.title = collection_data.title
    collection_db.games = games

    session.add(collection_db)
    session.commit()
    session.refresh(collection_db)

    return collection_db

# Obter jogos na coleção
def get_collection_games(
    session: Session,
    collection_id: int
) -> list[Game]:

    stmt = (
        select(Game)
        .join(CollectionGameLink)
        .where(
            CollectionGameLink.collection_id == collection_id
        )
    )

    return session.exec(stmt).all()