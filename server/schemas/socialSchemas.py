from datetime import datetime
from uuid import UUID
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")

class FriendshipCreate(Input):
    friend_id: int = Field(gt=0)

class FriendshipUpdate(Input):
    status: Literal['accepted', 'rejected', 'blocked']

class MessageCreate(Input):
    receiver_id: int = Field(gt=0)
    content: str = Field(min_length=1, max_length=10000)
    @model_validator(mode="after")
    def nonempty(self):
        if not self.content.strip():
            raise ValueError('Mensagem vazia')
        return self

class MessageUpdate(Input):
    content: str = Field(min_length=1, max_length=10000)
    @model_validator(mode="after")
    def nonempty(self):
        if not self.content.strip():
            raise ValueError('Mensagem vazia')
        return self

class GroupCreate(Input):
    name: str = Field(min_length=1, max_length=100)
    member_ids: list[int] = Field(default_factory=list, max_length=49)
    @model_validator(mode="after")
    def clean(self):
        if not self.name.strip():
            raise ValueError('Nome vazio')
        if any(i <= 0 for i in self.member_ids):
            raise ValueError('member_ids inválido')
        return self

class GroupUpdate(Input):
    name: str = Field(min_length=1, max_length=100)
    @model_validator(mode="after")
    def nonempty(self):
        if not self.name.strip():
            raise ValueError('Nome vazio')
        return self

class GroupMemberAdd(Input):
    user_id: int = Field(gt=0)

class GroupMessageCreate(Input):
    content: str = Field(min_length=1, max_length=10000)
    @model_validator(mode="after")
    def nonempty(self):
        if not self.content.strip():
            raise ValueError('Mensagem vazia')
        return self

class CollectionCreate(Input):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=10000)
    game_ids: list[int] = Field(default_factory=list, max_length=1000)

class CollectionUpdate(Input):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=10000)
    game_ids: list[int] | None = Field(default=None, max_length=1000)
    @model_validator(mode="after")
    def nonnull(self):
        for key in self.model_fields_set & {'name', 'game_ids'}:
            if getattr(self, key) is None:
                raise ValueError(f'{key} não pode ser null')
        return self

class RatingCreate(Input):
    game_id: int = Field(gt=0)
    score: int = Field(ge=0, le=10)
    review: str | None = Field(default=None, max_length=10000)

class RatingUpdate(Input):
    score: int | None = Field(default=None, ge=0, le=10)
    review: str | None = Field(default=None, max_length=10000)
    @model_validator(mode="after")
    def nonnull(self):
        if 'score' in self.model_fields_set and self.score is None:
            raise ValueError('score não pode ser null')
        return self

class PlaySessionCreate(Input):
    client_session_id: UUID | None = None
    game_id: int = Field(gt=0)
    started_at: datetime
    ended_at: datetime | None = None
    @model_validator(mode="after")
    def interval(self):
        if self.started_at.tzinfo is None or (self.ended_at is not None and self.ended_at.tzinfo is None):
            raise ValueError('Envie datas com fuso horário, por exemplo 2026-10-12T18:00:00Z')
        if self.ended_at is not None and self.ended_at < self.started_at:
            raise ValueError('ended_at deve ser posterior ou igual a started_at')
        return self

class PlaySessionEnd(Input):
    ended_at: datetime
    @model_validator(mode="after")
    def timezone(self):
        if self.ended_at.tzinfo is None:
            raise ValueError('Envie ended_at com fuso horário')
        return self
