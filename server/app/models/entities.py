from datetime import datetime, timezone
from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel

def now():
    return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=80)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str
    display_name: str | None = None
    is_active: bool = True
    is_banned: bool = False
    created_at: datetime = Field(default_factory=now)

class Game(SQLModel, table=True):
    # Cada linha representa um jogo na biblioteca de uma conta.
    __tablename__ = "game"
    __table_args__ = (UniqueConstraint("owner_id", "steam_appid"),)
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=150, index=True)
    steam_appid: int | None = None
    description: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    play_time: int = 0  # segundos, atualizado por sessões concluídas
    favorite: bool = False
    is_active: bool = True

class Tag(SQLModel, table=True):
    __tablename__ = "tag"
    __table_args__ = (UniqueConstraint("owner_id", "name"),)
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=80)

class GameTagLink(SQLModel, table=True):
    __tablename__ = "game_tag_link"
    game_id: int = Field(foreign_key="game.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)

class Collection(SQLModel, table=True):
    __tablename__ = "collection"
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=150)
    cover: str | None = None

class CollectionGameLink(SQLModel, table=True):
    __tablename__ = "collection_game_link"
    collection_id: int = Field(foreign_key="collection.id", primary_key=True)
    game_id: int = Field(foreign_key="game.id", primary_key=True)

class GameSession(SQLModel, table=True):
    __tablename__ = "game_session"
    __table_args__ = (UniqueConstraint("owner_id", "client_session_id"),)
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    game_id: int = Field(foreign_key="game.id", index=True)
    client_session_id: str = Field(max_length=36)
    iniciada_em: datetime
    encerrada_em: datetime
    duracao_segundos: int

class UserRating(SQLModel, table=True):
    __tablename__ = "user_rating"
    __table_args__ = (UniqueConstraint("user_id", "game_id"),)
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    game_id: int = Field(foreign_key="game.id", index=True)
    stars: float
    gameplay: int | None = None
    graphics: int | None = None
    story: int | None = None
