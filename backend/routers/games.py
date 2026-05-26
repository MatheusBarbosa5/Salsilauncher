from fastapi import (
    APIRouter, 
    Body,
    HTTPException, 
    Query, 
    Depends,
    Form
    )

import os
import subprocess

import psutil
from sqlmodel import Session
from typing import List, Optional
from pathlib import Path
from core.logging import logger
from utils.scan_validation import validar_scan_path
from models.games import Game, GameCreate, GameUpdate
from models.game_session import SessaoGame, SessaoGameCreate
from repositories import (
    games as game_repo,
    game_session as game_session_repo
    )
from database import get_session
from sqlmodel import Session
from datetime import datetime, timezone

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("/", response_model=List[Game])
def listar_games(
    q: Optional[str] = Query(None, description="Busca por nome ou descrição"),
    tags: Optional[str] = Query(None, description="Tags separadas por vírgula (ex: fps,rpg)"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    return game_repo.get_all_games(session, q=q, tags=tags, limit=limit, offset=offset)

@router.get("/{game_id}", response_model=Game)
def obter_game(game_id: int, session: Session = Depends(get_session)):
    game = game_repo.get_game_by_id(session, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return game

@router.post("/", response_model=Game, status_code=201)
def criar_game(game: GameCreate, session: Session = Depends(get_session)):
    return game_repo.create_game(session, game)

@router.put("/{game_id}", response_model=Game)
def atualizar_game(game_id: int, game_update: GameUpdate, session: Session = Depends(get_session)):
    game_atualizado = game_repo.update_game(session, game_id, game_update)
    if not game_atualizado:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return game_atualizado

@router.delete("/{game_id}", status_code=204)
def deletar_game(game_id: int, session: Session = Depends(get_session)):
    sucesso = game_repo.delete_game(session, game_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return

@router.post("/scan")
def escanear_pasta_por_games(
    caminho: str = Form(...),
    session: Session = Depends(get_session)
):
    """
    Varre um diretório em busca de novas pastas contendo executáveis .exe.
    Cria games automaticamente para qualquer pasta nova detectada.
    """
    
    logger.info("POST /scan chamado (caminho=%s)", caminho)
    
    scan_path = Path(caminho) # Objeto Path do caminho do DIRETÓRIO
    validar_scan_path(scan_path) # Validar objeto Path do DIRETÓRIO

    games = game_repo.get_all_games(session, offset=0, limit=10_000) 
    pastas_existentes = {j.caminho_pasta for j in games}
    novos = []

    # Descobrir novas pastas
    def descobrir_pastas_validas():
        for nome in os.listdir(caminho):
            pasta = os.path.join(caminho, nome)
            if os.path.isdir(pasta) and pasta not in pastas_existentes:
                yield pasta

    # Encontrar executável na pasta
    def encontrar_executavel(pasta):
        for root, _, files in os.walk(pasta):
            for f in files:
                if f.lower().endswith(".exe"):
                    return os.path.join(root, f)
        return None

    # Criar o objeto Game a partir da pasta
    def criar_game_para_pasta(pasta, executavel):
        nome = os.path.basename(pasta)
        return Game(
            nome=nome,
            caminho_executavel=executavel,
            caminho_pasta=pasta
        )

    # Processar pastas novas
    for pasta in descobrir_pastas_validas(): # Pasta valida (em algum sentido)
        exe = encontrar_executavel(pasta)
        if not exe:
            logger.warning("Pasta ignorada (sem executável): %s", pasta)
            continue  # ignorar pastas sem executável
        game = criar_game_para_pasta(pasta, exe)
        criado = game_repo.create_game(session, game)
        novos.append(criado)

    # salvar se mudou
    if novos:
        logger.info("%d novos games adicionados via scan", len(novos))

    return {
        "status": f"{len(novos)} games adicionados.",
        "adicionados": [j.id for j in novos],
        "total_biblioteca": len(games) + len(novos)
    }

@router.get("/abrir/{game_id}")
def abrir_game(
    game_id: int,
    session: Session = Depends(get_session)
):
    game = game_repo.get_game_by_id(session, game_id)

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game não encontrado"
        )
    
    sessao_ativa = (
        game_session_repo
        .get_active_sessions_by_game(
            session,
            game.id
        )
    )

    if sessao_ativa:
        raise HTTPException(
            status_code=400,
            detail="Game já está em execução"
        )

    try:
        processo = subprocess.Popen(game.caminho_executavel, shell=True)
        proc = psutil.Process(processo.pid)

        sessao_game = SessaoGameCreate(
            game_id = game.id,
            pid = processo.pid,
            pid_criado_em = proc.create_time(),
            iniciada_em = datetime.now(timezone.utc)
        )

        game_session_repo.create_session(session, sessao_game)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return {"status": "Game iniciado"}