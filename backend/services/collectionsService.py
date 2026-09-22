from typing import Optional, List
from sqlmodel import Session

from models.collections import Collection, CollectionCreate, CollectionUpdate
from repositories import collections as collectionRepository
from models.games import Game, CollectionGameLink

# Obter coleções
def get_collections(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0
) -> List[Collection]:

    return collectionRepository.get_collections(
        session=session,
        q=q,
        limit=limit,
        offset=offset
    )

# Obter jogos na coleção
def get_collection_games(
    session: Session,
    collection_id: int
) -> List[Game]:

    return collectionRepository.get_collection_games(
        session=session,
        collection_id=collection_id
    )

# Criar coleção
def create_collection(
    session: Session,
    collection: CollectionCreate
) -> Collection:

    return collectionRepository.create_collection(
        session=session,
        collection_data=collection
    )

# Atualizar coleção
def update_collection(
    session: Session,
    collection_id: int,
    collection_update: CollectionUpdate
) -> Collection | None:

    return collectionRepository.update_collection(
        session=session,
        collection_id=collection_id,
        collection_data=collection_update
    )

def delete_collection(session: Session, collection_id: int) -> bool:
    return collectionRepository.delete_collection(session, collection_id)

# adicionar jogo na coleção
def add_game_to_collection(session: Session, collection_id: int, game_id: int) -> bool:
    return collectionRepository.add_game_to_collection(
        session=session,
        collection_id=collection_id,
        game_id=game_id
    )

# remover jogo da coleção
def remove_game_from_collection(
    session: Session,
    collection_id: int,
    game_id: int
) -> bool:

    return collectionRepository.remove_game_from_collection(
        session=session,
        collection_id=collection_id,
        game_id=game_id
    )