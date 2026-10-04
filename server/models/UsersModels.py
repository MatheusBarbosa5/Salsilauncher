from datetime import datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)

    username: str = Field(
        max_length=80,
        unique=True,
        nullable=False,
        index=True,
    )

    email: str = Field(
        max_length=255,
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: str = Field(
        max_length=255,
        nullable=False,
    )

    display_name: str | None = Field(
        default=None,
        max_length=100,
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=512,
    )

    is_active: bool = Field(
        default=True,
        nullable=False,
    )

    is_banned: bool = Field(
        default=False,
        nullable=False,
    )

    language: str = Field(
        default="pt-BR",
        max_length=10,
        nullable=False,
    )

    theme: str = Field(
        default="dark",
        max_length=20,
        nullable=False,
    )

    last_login_at: datetime | None = None

    last_activity_at: datetime | None = None

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )