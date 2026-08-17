from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.collections import Collection
    from models.game_session import GameSession
    from models.tags import Tag
    from models.userRatings import UserRating

# Relacionamento com coleção
class CollectionGameLink(SQLModel, table=True):
    __tablename__ = "collection_game_link"
    
    collection_id: int | None = Field(
        default=None,
        foreign_key="collection.id",
        primary_key=True
    )
    game_id: int | None = Field(
        default=None,
        foreign_key="game.id",
        primary_key=True
    )

# relacionamento com Tag | Um jogo possui várias tags e Uma tag possui vários jogos (N:N)
class GameTagLink(SQLModel, table=True):
    __tablename__ = "game_tag_link"

    game_id: int | None = Field(
        default=None,
        foreign_key="game.id",
        primary_key=True
    )

    tag_id: int | None = Field(
        default=None,
        foreign_key="tag.id",
        primary_key=True
    )

# Modelo Principal
class Game(SQLModel, table=True):
    __tablename__ = "game"

    id: int | None = Field(
        default=None,
        primary_key=True,
        index=True
    )
    title: str = Field(index=True)
    description: str | None = None
    exe_path: str
    folder_path: str = Field(index=True)
    cover: str | None = None
    background: str | None = None

    extra_images: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )

    tags: list["Tag"] = Relationship(
        back_populates="games",
        link_model=GameTagLink
    )

    play_time: int = Field(default=0, ge=0)
    favorite: bool = False
    is_active: bool = True

    collections: list["Collection"] = Relationship(
        back_populates="games",
        link_model=CollectionGameLink
    )

    sessions: list["GameSession"] = Relationship(
        back_populates="games"
    )

    ratings: list["UserRating"] = Relationship(
    back_populates="game"
    )

class GameCreate(SQLModel):
    title: str
    description: str | None = None
    exe_path: str
    folder_path: str
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] = Field(default_factory=list)
    tag_ids: list[int] = Field(default_factory=list)
    play_time: int = Field(default=0)
    favorite: bool = False
    is_active: bool = True
    
class GameUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    exe_path: str | None = None
    folder_path: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] | None = None
    tag_ids: list[int] | None = None
    play_time: int | None = None
    favorite: bool | None = None