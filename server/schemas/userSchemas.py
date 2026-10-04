from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    display_name: str | None = Field(
        default=None,
        max_length=100,
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=512,
    )

    language: str = Field(
        default="pt-BR",
        max_length=10,
    )

    theme: str = Field(
        default="dark",
        max_length=20,
    )


class UserUpdate(BaseModel):
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=80,
    )

    email: EmailStr | None = None

    password: str | None = Field(
        default=None,
        min_length=6,
        max_length=128,
    )

    display_name: str | None = Field(
        default=None,
        max_length=100,
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=512,
    )

    language: str | None = Field(
        default=None,
        max_length=10,
    )

    theme: str | None = Field(
        default=None,
        max_length=20,
    )


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    display_name: str | None
    avatar_url: str | None
    is_active: bool
    is_banned: bool
    language: str
    theme: str
    last_login_at: datetime | None
    last_activity_at: datetime | None
    created_at: datetime
    updated_at: datetime