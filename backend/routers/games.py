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
from sqlmodel import Session, select, or_
from datetime import datetime, timezone
from services import gameService
from services import monitor_service
from services.steamService import get_game_details, search_steam_store
from services import tagService
from services import recommendationService
from fastapi import APIRouter, Depends, HTTPException


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


@router.get("/recent", response_model=list[dict])
def get_recent_games(
    limit: int = Query(8, ge=1, le=20),
    session: Session = Depends(get_session),
):
    games = game_session_repo.get_recently_played_games(session, limit)
    return [
        {**game.model_dump(), "tags": [tag.model_dump() for tag in game.tags]}
        for game in games
    ]


@router.get("/recommendations", response_model=dict)
async def get_recommendations(
    limit: int = Query(8, ge=1, le=20),
    session: Session = Depends(get_session),
):
    return await recommendationService.build_recommendations(session, limit)

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
async def create_game(
    game: GameCreate,
    session: Session = Depends(get_session)
):
    if game.steam_appid:
        steam_game = await get_game_details(game.steam_appid)

        if steam_game is None:
            raise HTTPException(
                status_code=404,
                detail="Jogo não encontrado na Steam"
            )

        game.title = steam_game["title"]
        game.description = steam_game["description"]
        game.cover = steam_game["cover"]
        game.vertical_cover = steam_game["vertical_cover"]
        game.background = steam_game["background"]
        game.tag_ids = [
            tagService.post_tags(session, genre).id
            for genre in steam_game.get("genres", [])
            if genre.strip()
        ]

    # Verifica se já existe um jogo com o mesmo exe_path, steam_appid ou title
    condicoes = [
        Game.exe_path == game.exe_path,
        Game.title == game.title
    ]
    if game.steam_appid is not None:
        condicoes.append(Game.steam_appid == game.steam_appid)

    jogo_existente = session.exec(select(Game).where(or_(*condicoes))).first()

    if jogo_existente:
        if jogo_existente.is_active:
            raise HTTPException(
                status_code=409,
                detail=f"O jogo '{jogo_existente.title}' já está na sua biblioteca."
            )
        else:
            # Se estava inativo (deletado via soft delete), reativa e atualiza
            jogo_existente.is_active = True
            jogo_existente.exe_path = game.exe_path
            jogo_existente.folder_path = game.folder_path
            session.add(jogo_existente)
            session.commit()
            session.refresh(jogo_existente)
            return {
                **jogo_existente.model_dump(),
                "tags": [tag.model_dump() for tag in jogo_existente.tags]
            }

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
async def escanear_pasta_por_games(
    caminho: str = Form(...),
    session: Session = Depends(get_session)
):
    logger.info("POST /scan chamado (caminho=%s)", caminho)
    
    scan_path = Path(caminho) 
    validar_scan_path(scan_path) 

    games = game_repo.get_games(session, offset=0, limit=10_000) 
    
    # Usa folder_path para checar as pastas e exe_path para checar os executáveis
    pastas_existentes = {
        os.path.normcase(os.path.abspath(j.folder_path)) 
        for j in games if j.folder_path
    }
    exes_existentes = {
        os.path.normcase(os.path.abspath(j.exe_path)) 
        for j in games if j.exe_path
    }
    steam_ids_existentes = {j.steam_appid for j in games if j.steam_appid}
    
    novos = []

    def descobrir_pastas_validas():
        for nome in os.listdir(caminho):
            pasta = os.path.join(caminho, nome)
            pasta_norm = os.path.normcase(os.path.abspath(pasta))
            if os.path.isdir(pasta) and pasta_norm not in pastas_existentes:
                yield pasta

    def encontrar_executavel(pasta):
        for root, _, files in os.walk(pasta):
            for f in files:
                if f.lower().endswith(".exe"):
                    return os.path.join(root, f)
        return None

    async def criar_game_para_pasta(pasta, executavel):
        nome = os.path.basename(pasta)
        metadata = {}
        tag_ids = []

        # O nome da pasta normalmente corresponde ao nome de instalação. Quando a
        # Steam encontra uma correspondência, aproveitamos capa, descrição e gêneros.
        try:
            results = await search_steam_store(nome)
            normalized_name = "".join(char for char in nome.lower() if char.isalnum())
            match = next(
                (
                    result for result in results
                    if "".join(char for char in result["name"].lower() if char.isalnum())
                    == normalized_name
                ),
                results[0] if results else None,
            )
            if match:
                details = await get_game_details(match["appid"])
                if details:
                    metadata = details
                    tag_ids = [
                        tagService.post_tags(session, genre).id
                        for genre in details.get("genres", [])
                        if genre.strip()
                    ]
        except Exception as error:
            # Falha de rede/metadados não deve impedir o jogo local de ser adicionado.
            logger.warning("Não foi possível enriquecer '%s' com dados da Steam: %s", nome, error)

        return GameCreate(
            title=metadata.get("title", nome),
            exe_path=executavel,
            folder_path=pasta,
            steam_appid=metadata.get("steam_appid"),
            description=metadata.get("description"),
            cover=metadata.get("cover"),
            vertical_cover=metadata.get("vertical_cover"),
            background=metadata.get("background"),
            tag_ids=tag_ids,
        )

    for pasta in descobrir_pastas_validas(): 
        exe = encontrar_executavel(pasta)
        if not exe:
            logger.warning("Pasta ignorada (sem executável): %s", pasta)
            continue
            
        # Garante que o executável encontrado também não está cadastrado
        exe_norm = os.path.normcase(os.path.abspath(exe))
        if exe_norm in exes_existentes:
            logger.info("Jogo ignorado (executável já cadastrado): %s", exe)
            continue

        game = await criar_game_para_pasta(pasta, exe)
        if game.steam_appid and game.steam_appid in steam_ids_existentes:
            logger.info("Jogo ignorado (Steam AppID já cadastrado): %s", game.steam_appid)
            continue
        criado = game_repo.create_game(session, game)
        novos.append(criado)
        exes_existentes.add(exe_norm) # Evita duplicatas dentro do mesmo ciclo de scan
        if game.steam_appid:
            steam_ids_existentes.add(game.steam_appid)

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
        monitor_service.iniciar_monitoramento()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return {"status": "Game iniciado"}

@router.get("/{game_id}/sessions")
def list_local_sessions(game_id: int, limit: int = Query(100, ge=1, le=100), offset: int = Query(0, ge=0), session: Session = Depends(get_session)):
    """Histórico local para sincronização; não retorna PIDs nem caminhos de executáveis."""
    from sqlmodel import select
    if session.get(Game, game_id) is None:
        raise HTTPException(404, "Jogo não encontrado")
    rows = session.exec(select(GameSession).where(GameSession.game_id == game_id).order_by(GameSession.id).offset(offset).limit(limit)).all()
    return [{"id": row.id, "game_id": row.game_id, "iniciada_em": row.iniciada_em, "encerrada_em": row.encerrada_em, "ativa": row.ativa, "duracao_segundos": row.duracao_segundos} for row in rows]
