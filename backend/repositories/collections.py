from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional

from models.collections import Collection, CollectionCreate, CollectionUpdate
from models.games import Game

def get_all_collections(
        session: Session,
        q: Optional[str] = None,
        limit: int = 25, 
        offset: int = 0
        ):
    
    stmt = select(Collection)

    if q:
        q_lower = f"%{q.lower()}%"
        stmt = stmt.where(or_(
            Collection.title.ilike(q_lower), 
            Collection.description.ilike(q_lower)
            ))

    # Busca no banco de dados
    collections = session.exec(stmt).all()

    return collections[offset : offset + limit]

def create_collection(
    session: Session,
    collection_data: CollectionCreate
):
    
    games = session.exec(
        select(Game).where(
            Game.id.in_(collection_data.game_ids)
        )
    ).all()

    if len(games) != len(collection_data.game_ids):
        raise ValueError(
            "Um ou mais jogos informados não existem."
        )

    collection = Collection(
        title=collection_data.title,
        games=games
    )

    session.add(collection)
    session.commit()
    session.refresh(collection)

    return collection


def update_collection(
    session: Session,
    collection_id: int,
    collection_data: CollectionUpdate
):

    collection = session.get(
        Collection,
        collection_id
    )

    if collection is None:
        return None

    games = session.exec(
        select(Game).where(
            Game.id.in_(collection_data.game_ids)
        )
    ).all()

    if len(games) != len(collection_data.game_ids):
        raise ValueError(
            "Um ou mais jogos informados não existem."
        )

    collection.title = collection_data.title
    collection.games = games

    session.add(collection)
    session.commit()
    session.refresh(collection)

    return collection