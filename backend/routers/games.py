from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session
from typing import List, Optional

from models.games import Jogo, JogoCreate, JogoUpdate
from repositories import games as game_repo
from database import get_session

router = APIRouter(prefix="/jogos", tags=["Jogos"])

@router.get("/", response_model=List[Jogo])
def listar_jogos(
    q: Optional[str] = Query(None, description="Busca por nome ou descrição"),
    tags: Optional[str] = Query(None, description="Tags separadas por vírgula (ex: fps,rpg)"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    return game_repo.get_all_games(session, q=q, tags=tags, limit=limit, offset=offset)

@router.get("/{jogo_id}", response_model=Jogo)
def obter_jogo(jogo_id: int, session: Session = Depends(get_session)):
    jogo = game_repo.get_game_by_id(session, jogo_id)
    if not jogo:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return jogo

@router.post("/", response_model=Jogo, status_code=201)
def criar_jogo(jogo: JogoCreate, session: Session = Depends(get_session)):
    return game_repo.create_game(session, jogo)

@router.put("/{jogo_id}", response_model=Jogo)
def atualizar_jogo(jogo_id: int, jogo_update: JogoUpdate, session: Session = Depends(get_session)):
    jogo_atualizado = game_repo.update_game(session, jogo_id, jogo_update)
    if not jogo_atualizado:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return jogo_atualizado

@router.delete("/{jogo_id}", status_code=204)
def deletar_jogo(jogo_id: int, session: Session = Depends(get_session)):
    sucesso = game_repo.delete_game(session, jogo_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return