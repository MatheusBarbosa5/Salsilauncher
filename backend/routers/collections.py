from fastapi import (
    APIRouter, 
    Body,
    HTTPException, 
    Query, 
    Depends,
    Form
    )

from sqlmodel import Session
from typing import List, Optional
from models.games import Game, GameCreate, GameUpdate
from models.collections import Collection, CollectionCreate, CollectionUpdate
from repositories import collections as collection_repo

from services import collectionsService
    
from database import get_session
from sqlmodel import Session


router = APIRouter(prefix="/collections", tags=["Collections"])

# Obter as coleções
@router.get("/", response_model=list[Collection])
def get_collections(
    q: str | None = Query(None, description="Search by title"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    return collectionsService.get_collections(
        session=session,
        q=q,
        limit=limit,
        offset=offset
    )

# Obter todos os jogos da coleção
@router.get("/{collection_id}", response_model=list[Game])
def get_collection_games(
    collection_id: int,
    session: Session = Depends(get_session)
):
    return collectionsService.get_collection_games(
        session=session,
        collection_id=collection_id
    )

# Criar coleção
@router.post("/", response_model=Collection, status_code=201)
def create_collection(
    collection: CollectionCreate,
    session: Session = Depends(get_session)
):
    return collectionsService.create_collection(
        session=session,
        collection=collection
    )

# Atualizar coleção
@router.put("/{collection_id}", response_model=Collection)
def update_collection(
    collection_id: int,
    collection_update: CollectionUpdate,
    session: Session = Depends(get_session)
):
    updated_collection = collectionsService.update_collection(
        session=session,
        collection_id=collection_id,
        collection_update=collection_update
    )

    if not updated_collection:
        raise HTTPException(
            status_code=404,
            detail="Collection not found"
        )

    return updated_collection


# Deletar coleção
@router.delete("/{collection_id}")
def delete_collection(
    collection_id: int,
    session: Session = Depends(get_session)
):
    success = collectionsService.delete_collection(session, collection_id)

    if not success:
        raise HTTPException(status_code=404, detail="tag não encontrada")
    
    return

# adicionar jogo na coleção
@router.post("/{collection_id}/games/{game_id}")
def add_game_to_collection(
    collection_id: int,
    game_id: int,
    session: Session = Depends(get_session)
):
    success = collectionsService.add_game_to_collection(
        session=session,
        collection_id=collection_id,
        game_id=game_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Collection ou Game não encontrado"
        )

    return {"message": "Game adicionado à coleção"}

# remover jogo da coleção
@router.delete("/{collection_id}/games/{game_id}")
def remove_game_from_collection(
    collection_id: int,
    game_id: int,
    session: Session = Depends(get_session)
):
    success = collectionsService.remove_game_from_collection(
        session=session,
        collection_id=collection_id,
        game_id=game_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Relação coleção jogo não encontrada"
        )

    return {"message": "Game removido da coleção"}