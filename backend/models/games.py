from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON


if TYPE_CHECKING:
    from models.collections import Colecao
    from models.game_session import SessaoJogo

class ColecaoJogoLink(SQLModel, table=True):
    __tablename__ = "colecao_jogo_link"
    
    colecao_id: Optional[int] = Field(
        default=None,
        foreign_key="colecao.id",
        primary_key=True
    )
    jogo_id: Optional[int] = Field(
        default=None,
        foreign_key="jogo.id",
        primary_key=True
    )

# Modelo Principal
class Jogo(SQLModel, table=True):
    __tablename__ = "jogo"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        index=True
    )
    nome: str = Field(index=True)
    descricao: Optional[str] = None
    caminho_executavel: str
    caminho_pasta: str = Field(index=True)
    capa: Optional[str] = None
    fundo: Optional[str] = None

    imagens_extras: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
    tags: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
    tempo_de_jogo: int = 0
    favorito: bool = False

    colecoes: List["Colecao"] = Relationship(
        back_populates="jogos",
        link_model=ColecaoJogoLink
    )

    sessoes: list["SessaoJogo"] = Relationship(
        back_populates="jogo"
    )

class JogoCreate(SQLModel):
    nome: str
    descricao: Optional[str] = None
    caminho_executavel: str
    caminho_pasta: str
    capa: Optional[str] = None
    fundo: Optional[str] = None
    imagens_extras: List[str] = []
    tags: List[str] = []
    tempo_de_jogo: int = 0
    favorito: bool = False

class JogoUpdate(SQLModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    caminho_executavel: Optional[str] = None
    caminho_pasta: Optional[str] = None
    capa: Optional[str] = None
    fundo: Optional[str] = None
    imagens_extras: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    tempo_de_jogo: Optional[int] = None
    favorito: Optional[bool] = None