from sqlmodel import SQLModel, Field, Relationship
from models.games import GameTagLink
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.games import Game

# Tabela
class Tag(SQLModel, table=True):
    __tablename__ = "tag"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    name: str = Field(
        unique=True,
        index=True
    )

    slug: str = Field(
        unique=True,
        index=True
    )

    games: list["Game"] = Relationship(
        back_populates="tags",
        link_model=GameTagLink
    )


    