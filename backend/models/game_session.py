from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from models.games import Game

class GameSession(SQLModel, table=True):
    __tablename__ = "sessao_game"

    id: int | None = Field(
        default=None,
        primary_key=True
        )
    game_id: int = Field(foreign_key="game.id")
    pid: int
    pid_criado_em: float
    iniciada_em: datetime
    encerrada_em: datetime | None = None
    ativa: bool = True
    duracao_segundos: int | None = None
    
    game: "Game" = Relationship(
        back_populates="sessions"
    )

class GameSessionCreate(SQLModel):
    game_id: int
    pid: int
    pid_criado_em: float
    iniciada_em: datetime