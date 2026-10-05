import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

@dataclass(frozen=True)
class Settings:
    database_url: str
    secret_key: str
    token_minutes: int
    cors_origins: list[str]

def get_settings() -> Settings:
    key = os.getenv("SECRET_KEY", "")
    if len(key) < 32 or key.startswith("SUBSTITUA_"):
        raise RuntimeError("Configure SECRET_KEY no server/.env com uma chave aleatória de pelo menos 32 caracteres")
    minutes = int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))
    if not 1 <= minutes <= 1440:
        raise RuntimeError("ACCESS_TOKEN_MINUTES deve estar entre 1 e 1440")
    url = os.getenv("DATABASE_URL", "sqlite:///./salsilauncher-remote.db")
    if url.startswith(("postgres://", "postgresql://")):
        url = "postgresql+psycopg://" + url.split("://", 1)[1]
    origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
    if "*" in origins:
        raise RuntimeError("Configure as origens explícitas em CORS_ORIGINS")
    return Settings(url, key, minutes, origins)
