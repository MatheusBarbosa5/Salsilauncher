from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")

class UserCreate(Input):
    username: str = Field(min_length=3, max_length=80, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)

class LoginData(Input):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    display_name: str | None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class GameCreate(Input):
    title: str = Field(min_length=1, max_length=150)
    steam_appid: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=20000)
    cover: str | None = Field(default=None, max_length=2048)
    background: str | None = Field(default=None, max_length=2048)
    extra_images: list[str] = Field(default_factory=list, max_length=50)
    tag_ids: list[int] = Field(default_factory=list, max_length=100)
    favorite: bool = False
    is_active: bool = True

class GameUpdate(Input):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=20000)
    cover: str | None = Field(default=None, max_length=2048)
    background: str | None = Field(default=None, max_length=2048)
    extra_images: list[str] | None = Field(default=None, max_length=50)
    tag_ids: list[int] | None = Field(default=None, max_length=100)
    favorite: bool | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def nonnull(self):
        for key in self.model_fields_set & {"title", "extra_images", "tag_ids", "favorite", "is_active"}:
            if getattr(self, key) is None:
                raise ValueError(f"{key} não pode ser null")
        return self

class CollectionCreate(Input):
    title: str = Field(min_length=1, max_length=150)
    cover: str | None = Field(default=None, max_length=2048)
    game_ids: list[int] = Field(default_factory=list, max_length=1000)

class CollectionUpdate(Input):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    cover: str | None = Field(default=None, max_length=2048)
    game_ids: list[int] | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def nonnull(self):
        for key in self.model_fields_set & {"title", "game_ids"}:
            if getattr(self, key) is None:
                raise ValueError(f"{key} não pode ser null")
        return self

class SessionCreate(Input):
    game_id: int = Field(gt=0)
    client_session_id: UUID
    iniciada_em: datetime
    encerrada_em: datetime

    @model_validator(mode="after")
    def valid_interval(self):
        if self.iniciada_em.tzinfo is None or self.encerrada_em.tzinfo is None:
            raise ValueError("Envie datas com fuso horário")
        seconds = (self.encerrada_em - self.iniciada_em).total_seconds()
        if not 1 <= seconds <= 86400:
            raise ValueError("A sessão deve durar entre 1 segundo e 24 horas")
        return self

class RatingCreate(Input):
    game_id: int = Field(gt=0)
    stars: float = Field(ge=0, le=5)
    gameplay: int | None = Field(default=None, ge=0, le=10)
    graphics: int | None = Field(default=None, ge=0, le=10)
    story: int | None = Field(default=None, ge=0, le=10)
