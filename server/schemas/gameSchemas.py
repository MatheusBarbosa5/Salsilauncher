from pydantic import BaseModel, Field

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
    id: int
    title: str
    steam_appid: int | None = None
    description: str | None = None
    cover: str | None = None
    background: str | None = None
    extra_images: list[str] = Field(default_factory=list)
    genres: list[str] = Field(default_factory=list)
    is_active: bool
