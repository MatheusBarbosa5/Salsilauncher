import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles

from database import create_db_and_tables

from fastapi.middleware.cors import CORSMiddleware

from routers import (
    gameRouters
    )

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servindo os arquivos estáticos da pasta uploads para o frontend consumir as imagens
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(gameRouters.router)


@app.get("/")
def root():
    return {"message": "Galo catou as 4 A.M"}