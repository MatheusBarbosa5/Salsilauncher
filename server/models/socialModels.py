from datetime import datetime
from sqlalchemy import CheckConstraint, UniqueConstraint, Column, Text
from sqlmodel import Field, SQLModel
from models.UsersModels import get_utc_now

class Friendship(SQLModel, table=True):
    __tablename__ = "friendships"
    __table_args__ = (UniqueConstraint("pair_key"), CheckConstraint("user_id <> friend_id", name="ck_friendships_distinct_users"), CheckConstraint("status IN ('pending', 'accepted', 'rejected', 'blocked')", name="ck_friendships_status"))
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    friend_id: int = Field(foreign_key="users.id", index=True)
    status: str = Field(default="pending", max_length=20)
    created_at: datetime = Field(default_factory=get_utc_now)
    pair_key: str = Field(max_length=50)  # par ordenado, impede pedidos invertidos duplicados
    blocked_by_id: int | None = Field(default=None, foreign_key="users.id")

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    id: int | None = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id", index=True)
    receiver_id: int = Field(foreign_key="users.id", index=True)
    content: str = Field(sa_column=Column(Text, nullable=False))
    sent_at: datetime = Field(default_factory=get_utc_now)
    read_at: datetime | None = None

class Collection(SQLModel, table=True):
    __tablename__ = "collections"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class CollectionGame(SQLModel, table=True):
    __tablename__ = "collection_games"
    collection_id: int = Field(foreign_key="collections.id", primary_key=True)
    game_id: int = Field(foreign_key="games.id", primary_key=True)

class Rating(SQLModel, table=True):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("user_id", "game_id"), CheckConstraint("score >= 0 AND score <= 10", name="ck_ratings_score"))
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    score: int
    review: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class PlaySession(SQLModel, table=True):
    __tablename__ = "play_sessions"
    __table_args__ = (CheckConstraint("duration_seconds IS NULL OR duration_seconds >= 0", name="ck_play_sessions_duration"), UniqueConstraint("user_id", "client_session_id", name="uq_play_sessions_client"),)
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    client_session_id: str | None = Field(default=None, max_length=36)
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    created_at: datetime = Field(default_factory=get_utc_now)
