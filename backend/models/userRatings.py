from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship


if TYPE_CHECKING:
    from models.users import User
    from models.games import Game


class UserRating(SQLModel, table=True):
    __tablename__ = "user_rating"

    id: int | None = Field(
        default=None,
        primary_key=True,
        index=True
    )

    user_id: int = Field(
        foreign_key="users.id",
        index=True
    )

    game_id: int = Field(
        foreign_key="game.id",
        index=True
    )

    stars: float = Field(
        ge=0,
        le=5
    )

    gameplay: int | None = Field(
        default=None,
        ge=0,
        le=10
    )

    graphics: int | None = Field(
        default=None,
        ge=0,
        le=10
    )

    story: int | None = Field(
        default=None,
        ge=0,
        le=10
    )

    weight_gameplay: int = Field(
        default=6
    )

    weight_graphics: int = Field(
        default=2
    )

    weight_story: int = Field(
        default=2
    )

    created_at: datetime = Field(
        default_factory=datetime.now
    )

    updated_at: datetime | None = Field(
        default=None
    )

    user: "User" = Relationship(
        back_populates="ratings"
    )

    game: "Game" = Relationship(
        back_populates="ratings"
    )

# Import tardio para garantir que os nomes usados nas relationships existam
# no namespace do módulo durante a montagem dos mapeamentos.
from models.games import Game  # noqa: F401
from models.users import User  # noqa: F401


class UserRatingCreate(SQLModel):
    game_id: int
    stars: float = Field(
        ge=0,
        le=5
    )
    gameplay: int | None = Field(
        default=None,
        ge=0,
        le=10
    )
    graphics: int | None = Field(
        default=None,
        ge=0,
        le=10
    )
    story: int | None = Field(
        default=None,
        ge=0,
        le=10
    )


class UserRatingUpdate(SQLModel):
    stars: float | None = Field(
        default=None,
        ge=0,
        le=5
    )
    gameplay: int | None = Field(
        default=None,
        ge=0,
        le=10
    )
    graphics: int | None = Field(
        default=None,
        ge=0,
        le=10
    )
    story: int | None = Field(
        default=None,
        ge=0,
        le=10
    )