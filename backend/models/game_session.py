from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from models.games import Jogo

class SessaoJogo(SQLModel, table=True):
    __tablename__ = "sessao_jogo"

    id: int | None = Field(default=None, primary_key=True)
    jogo_id: int = Field(foreign_key="jogo.id")
    pid: int
    pid_criado_em: float
    iniciada_em: datetime
    encerrada_em: datetime | None = None
    ativa: bool = True
    duracao_segundos: int | None = None
    
    jogo: "Jogo" = Relationship(
        back_populates="sessoes"
    )

class SessaoJogoCreate(SQLModel):
    jogo_id: int
    pid: int
    pid_criado_em: float
    iniciada_em: datetime