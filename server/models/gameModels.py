from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Game(SQLModel, table=True):
    """Metadados persistidos de um jogo.

    O servidor não armazena caminhos locais nem controla a execução do jogo.
    Essas responsabilidades pertencem ao launcher/Electron no computador do usuário.
    """

    __tablename__ = "game"

    id: int | None = Field(default=None, primary_key=True, index=True)
    title: str = Field(index=True)
    steam_appid: int | None = Field(default=None, unique=True, index=True)
    description: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    genres: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_active: bool = True


class GameCreate(SQLModel):
    title: str
    steam_appid: int | None = None
    description: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] = Field(default_factory=list)
    genres: list[str] = Field(default_factory=list)
    is_active: bool = True


class GameUpdate(SQLModel):
    title: str | None = None
    steam_appid: int | None = None
    description: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] | None = None
    genres: list[str] | None = None
    is_active: bool | None = None
