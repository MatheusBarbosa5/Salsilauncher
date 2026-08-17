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
import subprocess
import shutil
import uuid

import psutil
from sqlmodel import Session
from typing import List, Optional
from pathlib import Path
from core.logging import logger
from utils.scan_validation import validar_scan_path
from models.games import Game, GameCreate, GameUpdate
from models.game_session import GameSession, GameSessionCreate
from repositories import (
    games as game_repo,
    game_session as game_session_repo
    )
from database import get_session
from sqlmodel import Session
from datetime import datetime, timezone
from services import gameService


router = APIRouter(prefix="/games", tags=["Games"])

# Funcionalidade nativa do OS para buscar arquivo
@router.get("/browse")
def browse_file():
    import tkinter as tk
    from tkinter import filedialog
    
    try:
        root = tk.Tk()
        root.withdraw()
        root.wm_attributes('-topmost', 1)
        file_path = filedialog.askopenfilename(
            title="Selecione o executável do jogo",
            filetypes=[("Arquivos Executáveis", "*.exe"), ("Todos os Arquivos", "*.*")]
        )
        root.destroy()
        
        return {"path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@router.get("/", response_model=list[dict])
def get_games(
    q: str | None = Query(None),
    tags: str | None = Query(None),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    games = gameService.get_games(
        session=session,
        q=q,
        tags=tags,
        limit=limit,
        offset=offset
    )

    return [
        {
            **game.model_dump(),
            "tags": [tag.model_dump() for tag in game.tags]
        }
        for game in games
        if game.is_active  # Filtra apenas jogos ativos
    ]

@router.get("/{game_id}", response_model=dict)
def get_game_by_id(
    game_id: int,
    session: Session = Depends(get_session)
):
    game = gameService.get_game_by_id(session, game_id)

    if not game:
        raise HTTPException(status_code=404, detail="Game não encontrado")

    return {
        **game.model_dump(),
        "tags": [tag.model_dump() for tag in game.tags]
    }

@router.post("/", response_model=dict, status_code=201)
def create_game(
    game: GameCreate,
    session: Session = Depends(get_session)
):
    new_game = gameService.create_game(session, game)
    return {
        **new_game.model_dump(),
        "tags": [tag.model_dump() for tag in new_game.tags]
    }

@router.put("/{game_id}", response_model=dict)
def update_game(
    game_id: int,
    game_update: GameUpdate,
    session: Session = Depends(get_session)
):
    updated_game = gameService.update_game(session, game_id, game_update)

    if not updated_game:
        raise HTTPException(status_code=404, detail="Game not found")

    return {
        **updated_game.model_dump(),
        "tags": [tag.model_dump() for tag in updated_game.tags]
    }

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
    logger.info("POST /scan chamado (caminho=%s)", caminho)
    
    scan_path = Path(caminho) 
    validar_scan_path(scan_path) 

    games = game_repo.get_games(session, offset=0, limit=10_000) 
    pastas_existentes = {j.exe_path for j in games}
    novos = []

    def descobrir_pastas_validas():
        for nome in os.listdir(caminho):
            pasta = os.path.join(caminho, nome)
            if os.path.isdir(pasta) and pasta not in pastas_existentes:
                yield pasta

    def encontrar_executavel(pasta):
        for root, _, files in os.walk(pasta):
            for f in files:
                if f.lower().endswith(".exe"):
                    return os.path.join(root, f)
        return None

    def criar_game_para_pasta(pasta, executavel):
        nome = os.path.basename(pasta)
        return GameCreate(
            title=nome,
            exe_path=executavel,
            folder_path=pasta
        )

    for pasta in descobrir_pastas_validas(): 
        exe = encontrar_executavel(pasta)
        if not exe:
            logger.warning("Pasta ignorada (sem executável): %s", pasta)
            continue  
        game = criar_game_para_pasta(pasta, exe)
        criado = game_repo.create_game(session, game)
        novos.append(criado)

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
        processo = subprocess.Popen(game.exe_path, shell=True)
        proc = psutil.Process(processo.pid)

        sessao_game = GameSessionCreate(
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