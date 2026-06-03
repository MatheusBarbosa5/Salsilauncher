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
    
from database import get_session
from sqlmodel import Session


router = APIRouter(prefix="/collections", tags=["Collections"])


@router.get("/", response_model=List[Collection])
def get_collections(
    q: Optional[str] = Query(None, description="Search by title"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    return collection_repo.get_all_collections(
        session,
        q=q, 
        limit=limit, 
        offset=offset
        )

@router.get("/{collection_id}", response_model=List[Game])
def get_games(
    collection_id: int,
    session: Session = Depends(get_session)
):
    return collection_repo.get_games(
        session,
        collection_id
        )


@router.post("/", response_model=Collection, status_code=201)
def create_collection(collection: CollectionCreate, session: Session = Depends(get_session)):
    return collection_repo.create_collection(session, collection)


@router.put("/{collection_id}", response_model=Collection)
def update_collection(
    collection_id: int, 
    collection_update: CollectionUpdate, 
    session: Session = Depends(get_session)
    ):

    collection_updated = collection_repo.update_collection(
        session, collection_id, collection_update
        )
    
    if not collection_updated:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection_updated