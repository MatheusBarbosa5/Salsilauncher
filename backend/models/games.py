from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON


if TYPE_CHECKING:
    from models.collections import Colecao
    from models.game_session import SessaoJogo

class ColecaoJogoLink(SQLModel, table=True):
    __tablename__ = "colecao_jogo_link"
    
    colecao_id: int | None = Field(
        default=None,
        foreign_key="colecao.id",
        primary_key=True
    )
    jogo_id: int | None = Field(
        default=None,
        foreign_key="jogo.id",
        primary_key=True
    )

# Modelo Principal
class Jogo(SQLModel, table=True):
    __tablename__ = "jogo"

    id: int | None = Field(
        default=None,
        primary_key=True,
        index=True
    )
    nome: str = Field(index=True)
    descricao: str | None = None
    caminho_executavel: str
    caminho_pasta: str = Field(index=True)
    capa: str | None = None
    fundo: str | None = None

    imagens_extras: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
    tags: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
    tempo_de_jogo: int = Field(default=0, ge=0)
    favorito: bool = False

    colecoes: list["Colecao"] = Relationship(
        back_populates="jogos",
        link_model=ColecaoJogoLink
    )

    sessoes: list["SessaoJogo"] = Relationship(
        back_populates="jogo"
    )

class JogoCreate(SQLModel):
    nome: str
    descricao: str | None = None
    caminho_executavel: str
    caminho_pasta: str
    capa: str | None = None
    fundo: str | None = None
    imagens_extras: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    tempo_de_jogo: int = Field(default=0)
    favorito: bool = False

class JogoUpdate(SQLModel):
    nome: str | None = None
    descricao: str | None = None
    caminho_executavel: str | None = None
    caminho_pasta: str | None = None
    capa: str | None = None
    fundo: str | None = None
    imagens_extras: list[str] | None = None
    tags: list[str] | None = None
    tempo_de_jogo: int | None = None
    favorito: bool | None = None