from datetime import datetime

from sqlmodel import SQLModel, Field


class Messages(SQLModel, table=True):
    __tablename__ = "messages"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    sender_id: int = Field(
        foreign_key="users.id"
    )

    receiver_id: int = Field(
        foreign_key="users.id"
    )

    content: str

    sent_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    read_at: datetime | None = Field(
        default=None
    )


class MessagesCreate(SQLModel):
    receiver_id: int
    content: str


class MessagesUpdate(SQLModel):
    read_at: datetime | None = None
