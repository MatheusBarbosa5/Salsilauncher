from datetime import date, datetime
from sqlalchemy import Column, JSON, String, Text
from sqlmodel import Field, SQLModel
from pydantic import AliasChoices, ConfigDict, model_validator
from models.UsersModels import get_utc_now

class Game(SQLModel, table=True):
    __tablename__ = "games"
    id: int | None = Field(default=None, primary_key=True)
    # Mantém os nomes Python da API atual; as colunas SQL seguem o diagrama.
    title: str = Field(sa_column=Column("name", String(255), nullable=False, index=True))
    steam_appid: int | None = Field(default=None, unique=True, index=True)
    description: str | None = Field(default=None, sa_column=Column(Text))
    cover: str | None = Field(default=None, sa_column=Column("cover_url", String(512)))
    background: str | None = Field(default=None, sa_column=Column("header_url", String(512)))
    developer: str | None = Field(default=None, max_length=255)
    publisher: str | None = Field(default=None, max_length=255)
    release_date: date | None = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
    extra_images: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    genres: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    is_active: bool = True

class GameCreate(SQLModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    title: str = Field(min_length=1, max_length=255, validation_alias=AliasChoices("title", "name"))
    steam_appid: int | None = Field(default=None, gt=0)
    description: str | None = None
    cover: str | None = Field(default=None, max_length=512, validation_alias=AliasChoices("cover", "cover_url"))
    background: str | None = Field(default=None, max_length=512, validation_alias=AliasChoices("background", "header_url"))
    developer: str | None = Field(default=None, max_length=255)
    publisher: str | None = Field(default=None, max_length=255)
    release_date: date | None = None
    extra_images: list[str] = Field(default_factory=list, max_length=50)
    genres: list[str] = Field(default_factory=list, max_length=100)
    is_active: bool = True

class GameUpdate(SQLModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    title: str | None = Field(default=None, min_length=1, max_length=255, validation_alias=AliasChoices("title", "name"))
    steam_appid: int | None = Field(default=None, gt=0)
    description: str | None = None
    cover: str | None = Field(default=None, max_length=512, validation_alias=AliasChoices("cover", "cover_url"))
    background: str | None = Field(default=None, max_length=512, validation_alias=AliasChoices("background", "header_url"))
    developer: str | None = Field(default=None, max_length=255)
    publisher: str | None = Field(default=None, max_length=255)
    release_date: date | None = None
    extra_images: list[str] | None = Field(default=None, max_length=50)
    genres: list[str] | None = Field(default=None, max_length=100)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_nulls(self):
        for key in self.model_fields_set & {"title", "extra_images", "genres", "is_active"}:
            if getattr(self, key) is None:
                raise ValueError(f"{key} não pode ser null")
        return self
