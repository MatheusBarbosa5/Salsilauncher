from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship


if TYPE_CHECKING:
    from models.userRatings import UserRating


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    username: str = Field(
        unique=True,
        max_length=80
    )

    email: str = Field(
        unique=True,
        max_length=255
    )

    password_hash: str = Field(
        max_length=255
    )

    display_name: str | None = Field(
        default=None,
        max_length=100
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=512
    )

    steam_id: str | None = Field(
        default=None,
        unique=True,
        max_length=30
    )

    is_active: bool = Field(
        default=True
    )

    is_banned: bool = Field(
        default=False
    )

    language: str = Field(
        default="pt-BR",
        max_length=10
    )

    theme: str = Field(
        default="dark",
        max_length=20
    )

    last_login_at: datetime | None = Field(
        default=None
    )

    last_activity_at: datetime | None = Field(
        default=None
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    ratings: list["UserRating"] = Relationship(
        back_populates="user"
    )


class UserCreate(SQLModel):
    username: str
    email: str
    password_hash: str

    display_name: str | None = None
    avatar_url: str | None = None
    steam_id: str | None = None

    language: str = "pt-BR"
    theme: str = "dark"


class UserUpdate(SQLModel):
    username: str | None = None
    email: str | None = None
    password_hash: str | None = None

    display_name: str | None = None
    avatar_url: str | None = None
    steam_id: str | None = None

    is_active: bool | None = None
    is_banned: bool | None = None

    language: str | None = None
    theme: str | None = None

    last_login_at: datetime | None = None
    last_activity_at: datetime | None = None