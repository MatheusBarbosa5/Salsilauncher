from fastapi import (
    APIRouter, 
    Body,
    HTTPException, 
    Query, 
    Depends,
    Form,
    UploadFile,
    File
    )
import os
import shutil
import uuid

from sqlmodel import Session
from typing import List, Optional
from models.games import Game, GameCreate, GameUpdate
from models.collections import Collection, CollectionCreate, CollectionUpdate
from repositories import collections as collection_repo

from services import collectionsService
    
from database import get_session

router = APIRouter(prefix="/collections", tags=["Collections"])

@router.post("/upload-cover")
def upload_cover_image(file: UploadFile = File(...)):
    try:
        os.makedirs("uploads", exist_ok=True)
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"http://localhost:8000/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar imagem: {str(e)}")

# Evita o loop retornando dict limpo
@router.get("/", response_model=list[dict])
def get_collections(
    q: str | None = Query(None, description="Search by title"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    cols = collectionsService.get_collections(
        session=session,
        q=q,
        limit=limit,
        offset=offset
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "cover": c.cover
        }
        for c in cols
    ]

# Evita o loop retornando dict de jogos
@router.get("/{collection_id}", response_model=list[dict])
def get_collection_games(
    collection_id: int,
    session: Session = Depends(get_session)
):
    games = collectionsService.get_collection_games(
        session=session,
        collection_id=collection_id
    )
    return [
        {
            **game.model_dump(),
            "tags": [tag.model_dump() for tag in game.tags]
        }
        for game in games
    ]

# Retorna dict no POST para evitar referência circular e crash
@router.post("/", response_model=dict, status_code=201)
def create_collection(
    collection: CollectionCreate,
    session: Session = Depends(get_session)
):
    try:
        new_col = collectionsService.create_collection(
            session=session,
            collection=collection
        )
        return {
            "id": new_col.id,
            "title": new_col.title,
            "cover": new_col.cover
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Retorna dict no PUT para evitar referência circular e crash
@router.put("/{collection_id}", response_model=dict)
def update_collection(
    collection_id: int,
    collection_update: CollectionUpdate,
    session: Session = Depends(get_session)
):
    try:
        updated_col = collectionsService.update_collection(
            session=session,
            collection_id=collection_id,
            collection_update=collection_update
        )

        if not updated_col:
            raise HTTPException(
                status_code=404,
                detail="Collection not found"
            )

        return {
            "id": updated_col.id,
            "title": updated_col.title,
            "cover": updated_col.cover
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{collection_id}")
def delete_collection(
    collection_id: int,
    session: Session = Depends(get_session)
):
    success = collectionsService.delete_collection(session, collection_id)

    if not success:
        raise HTTPException(status_code=404, detail="tag não encontrada")
    
    return

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