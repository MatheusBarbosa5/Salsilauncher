import time
import psutil
import threading

from datetime import datetime, timezone
from sqlmodel import Session
from repositories import game_session as game_session_repo
from database import engine as default_engine
from models import games
from core.logging import logger


_monitor_threads: dict[str, threading.Thread] = {}
_monitor_lock = threading.Lock()


def conversor_utc(dt: datetime):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def processo_corresponde(sessao):
    try:
        processo = psutil.Process(sessao.pid)

        criado_em = processo.create_time()
        delta = abs(
            criado_em - sessao.pid_criado_em
        )


        return delta < 1

    except (
        psutil.NoSuchProcess,
        psutil.AccessDenied,
        psutil.ZombieProcess
    ):
        return False
    

def encerrar_sessao(session, sessao):
    
    # Por segurança...
    if not sessao.ativa: 
        return
    
    inicio = conversor_utc(sessao.iniciada_em)
    fim = datetime.now(timezone.utc)

    duracao = max(
        0,
        int((fim - inicio).total_seconds())
    )

    sessao.ativa = False
    sessao.encerrada_em = fim
    sessao.duracao_segundos = duracao

    game = session.get(games.Game, sessao.game_id)

    if game:
        game.play_time += duracao
        session.add(game)

    session.add(sessao)

    logger.info(
        "Sessão encerrada | sessao_id=%s | game_id=%s | duracao=%s",
        sessao.id,
        sessao.game_id,
        duracao
    )


def verificar_sessoes(session):
    sessoes = game_session_repo.get_all_active_sessions(session)

    for sessao in sessoes:
        try:
            if processo_corresponde(sessao):
                continue
            
            encerrar_sessao(session, sessao)
        
        except Exception:
            logger.exception(
                "Erro ao processar sessão %s",
                sessao.id
                )
    

def monitorar_sessoes(db_engine):
    logger.info("Worker iniciado")

    while True:
        try:
            with Session(db_engine) as session:
                verificar_sessoes(session)
                session.commit()

        except Exception:
            logger.exception("Erro no monitor")

        time.sleep(5)


def iniciar_monitoramento(db_engine=default_engine) -> None:
    """Start a monitor for the database that owns the local game session."""
    engine_key = str(db_engine.url.database)
    with _monitor_lock:
        thread = _monitor_threads.get(engine_key)
        if thread and thread.is_alive():
            return
        thread = threading.Thread(
            target=monitorar_sessoes,
            args=(db_engine,),
            name=f"salsilauncher-session-monitor-{len(_monitor_threads) + 1}",
            daemon=True,
        )
        _monitor_threads[engine_key] = thread
        thread.start()


if __name__ == "__main__":
    monitorar_sessoes(default_engine)