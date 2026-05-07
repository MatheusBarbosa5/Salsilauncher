import time
import psutil

from datetime import datetime, timezone
from sqlmodel import Session
from repositories import game_session as game_session_repo
from database import engine
from models import games
from core.logging import logger


def conversor_utc(dt: datetime):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def processo_corresponde(sessao):
    try:
        processo = psutil.Process(sessao.pid)

        criado_em = datetime.fromtimestamp(
            processo.create_time(),
            timezone.utc
        )

        delta = abs(
            (criado_em - sessao.pid_criado_em).total_seconds()
        )


        return delta < 1

    except psutil.NoSuchProcess:
        return False
    

def encerrar_sessao(session, sessao):
    inicio = conversor_utc(sessao.iniciada_em)
    fim = datetime.now(timezone.utc)

    duracao = max(
        0,
        int((fim - inicio).total_seconds())
    )

    sessao.ativa = False
    sessao.encerrada_em = fim
    sessao.duracao_segundos = duracao

    jogo = session.get(games.Jogo, sessao.jogo_id)

    if jogo:
        jogo.tempo_de_jogo += duracao
        session.add(jogo)

    session.add(sessao)


def verificar_sessoes(session):
    sessoes = game_session_repo.get_all_active_sessions(session)

    for sessao in sessoes:
        if processo_corresponde(sessao):
            continue
        
        encerrar_sessao(session, sessao)
    

def monitorar_sessoes():
    while True:
        try:
            with Session(engine) as session:
                verificar_sessoes(session)
                session.commit()

        except Exception:
            logger.exception("Erro no monitor")

        time.sleep(5)


if __name__ == "__main__":
    print("Worker iniciado...")
    monitorar_sessoes()