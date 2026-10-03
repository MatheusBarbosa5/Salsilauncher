from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from routers.gameRouters import router as game_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Salsilauncher Server",
    description="API de metadados de jogos do Salsilauncher",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_router)


@app.get("/")
def root():
    return {
        "message": "Salsilauncher Server online",
        "docs": "/docs",
        "scope": "game metadata",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
