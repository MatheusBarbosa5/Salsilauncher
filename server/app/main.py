from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import get_settings
from app.database import make_engine
from app.routers import auth, games, collections, tags, sessions, ratings, steam

def create_app(settings=None, engine=None):
    settings = settings or get_settings()
    engine = engine if engine is not None else make_engine(settings.database_url)
    @asynccontextmanager
    async def lifespan(app):
        yield
        engine.dispose()
    app = FastAPI(title="Salsilauncher — API remota", version="0.2.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.engine = engine
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])
    for module in (auth, games, collections, tags, sessions, ratings, steam):
        app.include_router(module.router)
    @app.get("/health", tags=["Health"])
    def health():
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok"}
    return app

# Uvicorn: --factory app.main:create_app
