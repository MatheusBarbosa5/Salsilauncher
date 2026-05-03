from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_db_and_tables
from routers import games
from models import games as game_models
from models import collections as collection_models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executa quando a API ligar
    create_db_and_tables()
    yield
    # Executa quando a API desligar

app = FastAPI(
    title="Salsilauncher", 
    description="Launcher social de jogos",
    lifespan=lifespan
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router)

@app.get("/")
def root():
    return {"message": "Bem-vindo ao Salsilauncher!"}