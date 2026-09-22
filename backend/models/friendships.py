from datetime import datetime

from sqlmodel import SQLModel, Field


class Friendship(SQLModel, table=True):
    __tablename__ = "friendships"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    user_id: int = Field(
        foreign_key="users.id"
    )

    friend_id: int = Field(
        foreign_key="users.id"
    )

    status: str = Field(
        default="pending",
        max_length=20
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )


class FriendshipCreate(SQLModel):
    friend_id: int


class FriendshipUpdate(SQLModel):
    status: str | None = None