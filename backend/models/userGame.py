from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field


class UserGameBase(SQLModel):
    is_favorite: bool = False
    is_hidden: bool = False
    last_played_at: datetime | None = None
    custom_title: str | None = Field(       # Nome personalizado do Jogo
        default=None,
        max_length=150
    )
    notes: str | None = None


class UserGame(UserGameBase, table=True):
    __tablename__ = "user_games"

    __table_args__ = (
        UniqueConstraint("user_id", "game_id"),
    )

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    user_id: int = Field(
        foreign_key="users.id"
    )

    game_id: int = Field(
        foreign_key="game.id"
    )

    added_at: datetime = Field(
        default_factory=datetime.utcnow
    )


class UserGameCreate(UserGameBase):
    game_id: int

class UserGameUpdate(SQLModel):
    is_favorite: bool | None = None
    is_hidden: bool | None = None
    last_played_at: datetime | None = None
    custom_title: str | None = Field(
        default=None,
        max_length=150
    )
    notes: str | None = None