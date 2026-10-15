from pydantic import BaseModel, Field, ConfigDict, computed_field
from datetime import datetime, date

# Resultado de pesquisa: candidato, não entidade persistida necessariamente
class GameSearchResult(BaseModel):
    id: int | None = None
    title: str
    steam_appid: int
    cover: str | None = None


class GameSearchResponse(BaseModel):
    source: str
    results: list[GameSearchResult]

# Identifica o jogo que o usuário escolheu na pesquisa
class GameResolveRequest(BaseModel):
    steam_appid: int = Field(gt=0)


# Response natural do jogo
class GameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    developer: str | None = None
    publisher: str | None = None
    release_date: date | None = None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def name(self) -> str:
        return self.title

    @computed_field
    @property
    def cover_url(self) -> str | None:
        return self.cover

    @computed_field
    @property
    def header_url(self) -> str | None:
        return self.background

    id: int
    title: str
    steam_appid: int | None = None
    description: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] = Field(default_factory=list)
    genres: list[str] = Field(default_factory=list)
    is_active: bool
