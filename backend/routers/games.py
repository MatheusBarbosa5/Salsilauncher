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
from models.games import Jogo, JogoCreate, JogoUpdate
from models.game_session import SessaoJogo, SessaoJogoCreate
from repositories import (
    games as game_repo,
    game_session as game_session_repo
    )
from database import get_session
from sqlmodel import Session
from datetime import datetime, timezone

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

@router.post("/scan")
def escanear_pasta_por_jogos(
    caminho: str = Form(...),
    session: Session = Depends(get_session)
):
    """
    Varre um diretório em busca de novas pastas contendo executáveis .exe.
    Cria jogos automaticamente para qualquer pasta nova detectada.
    """
    
    logger.info("POST /scan chamado (caminho=%s)", caminho)
    
    scan_path = Path(caminho) # Objeto Path do caminho do DIRETÓRIO
    validar_scan_path(scan_path) # Validar objeto Path do DIRETÓRIO

    jogos = game_repo.get_all_games(session, offset=0, limit=10_000) 
    pastas_existentes = {j.caminho_pasta for j in jogos}
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

    # Criar o objeto Jogo a partir da pasta
    def criar_jogo_para_pasta(pasta, executavel):
        nome = os.path.basename(pasta)
        return Jogo(
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
        jogo = criar_jogo_para_pasta(pasta, exe)
        criado = game_repo.create_game(session, jogo)
        novos.append(criado)

    # salvar se mudou
    if novos:
        logger.info("%d novos jogos adicionados via scan", len(novos))

    return {
        "status": f"{len(novos)} jogos adicionados.",
        "adicionados": [j.id for j in novos],
        "total_biblioteca": len(jogos) + len(novos)
    }

@router.get("/abrir/{jogo_id}")
def abrir_jogo(
    jogo_id: int,
    session: Session = Depends(get_session)
):
    jogo = game_repo.get_game_by_id(session, jogo_id)

    if not jogo:
        raise HTTPException(
            status_code=404,
            detail="Jogo não encontrado"
        )
    
    sessao_ativa = (
        game_session_repo
        .get_active_sessions_by_game(
            session,
            jogo.id
        )
    )

    if sessao_ativa:
        raise HTTPException(
            status_code=400,
            detail="Jogo já está em execução"
        )

    try:
        processo = subprocess.Popen(jogo.caminho_executavel, shell=True)
        proc = psutil.Process(processo.pid)

        sessao_jogo = SessaoJogoCreate(
            jogo_id = jogo.id,
            pid = processo.pid,
            pid_criado_em = proc.create_time(),
            iniciada_em = datetime.now(timezone.utc)
        )

        game_session_repo.create_session(session, sessao_jogo)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return {"status": "Jogo iniciado"}