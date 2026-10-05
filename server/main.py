import os
import platform
import sys
import time
from contextlib import asynccontextmanager

import psutil
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlmodel import Session

from database import engine, create_db_and_tables
from routers.gameRouters import router as game_router
from routers.userServices import router as user_router

# Iniciar tempo do servidor
START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):

    create_db_and_tables()

    yield

# app
app = FastAPI(
    title="Salsilauncher Server",
    description=(
        "Servidor global de entidades e metadados de jogos, "
        "com integração com a Steam."
    ),
    version="0.3.0",
    lifespan=lifespan,
)


# middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# rotas no swagger
app.include_router(game_router)
app.include_router(user_router)

# Validação de conexão com o banco de dados
def check_db_connection() -> bool:

    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))

        return True

    except Exception:
        return False


# Rota Raiz
@app.get("/")
def root():

    return {
        "message": "Salsilauncher Server online",
        "docs": "/docs",
        "health": "/health",
        "scope": "global game metadata + Steam",
        "version": app.version,
    }

# Health check
@app.get(
    "/health",
    tags=["Monitoring"],
)
def health():
    db_ok = check_db_connection()

    # Saúde
    status_str = "healthy" if db_ok else "unhealthy"

    # tempo de atividade
    uptime_seconds = int(time.time() - START_TIME)


    # Pid
    process = psutil.Process(os.getpid())

    # Conrumo de memória do processo Python
    memory_info = process.memory_info()

    memory_usage_mb = round(
        memory_info.rss / (1024 * 1024),
        2,
    )

    # CPU
    cpu_usage_percent = process.cpu_percent(interval=None)

    # Resposta
    payload = {
        "status": status_str,
        "version": app.version,

        "uptime_seconds": uptime_seconds,

        "checks": {
            "database": (
                "connected"
                if db_ok
                else "disconnected"
            ),
        },

        "system": {
            "cpu_usage_percent": cpu_usage_percent,
            "memory_usage_mb": memory_usage_mb,
            "python_version": sys.version.split()[0],
            "os": platform.system(),
        },
    }

    # Status HTTP
    http_status = (
        status.HTTP_200_OK
        if db_ok
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return JSONResponse(
        content=payload,
        status_code=http_status,
    )
