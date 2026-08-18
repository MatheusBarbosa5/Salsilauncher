import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles

from database import create_db_and_tables

from routers import (
    games,
    collections,
    tagsRouters,
    usersRouters,
    friendshipsRouters,
    userRouters,
    messagesRouters,
    userRatingsRouters
)

from fastapi.middleware.cors import CORSMiddleware

# CORREÇÃO: Garante que a pasta física exista logo na leitura do arquivo
# antes do StaticFiles tentar montá-la.
os.makedirs("uploads", exist_ok=True)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servindo os arquivos estáticos da pasta uploads para o frontend consumir as imagens
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(games.router)
app.include_router(collections.router)
app.include_router(tagsRouters.router)
app.include_router(usersRouters.router)
app.include_router(friendshipsRouters.router)
app.include_router(userRouters.router)
app.include_router(messagesRouters.router)
app.include_router(userRatingsRouters.router)

@app.get("/")
def root():
    return {"message": "Bem-vindo ao Salsilauncher!"}