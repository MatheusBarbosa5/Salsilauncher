from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from models.games import CollectionGameLink

if TYPE_CHECKING:
    from models.games import Game

class Collection(SQLModel, table=True):
    __tablename__ = "collection"
    
    id: int | None = Field(
        default=None,
        primary_key=True
    )
    title: str
    cover: str | None = None
    games: list["Game"] = Relationship(
        back_populates="collections",
        link_model=CollectionGameLink
    )

class CollectionCreate(SQLModel):
    title: str
    cover: str | None = None
    game_ids: list[int] = Field(
        default_factory=list
    )

class CollectionUpdate(SQLModel):
    title: str | None = None
    cover: str | None = None
    game_ids: list[int] | None = Field(
        default_factory=list
    )