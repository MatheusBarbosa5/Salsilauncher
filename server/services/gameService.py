from sqlmodel import Session

from models.gameModels import Game, GameCreate, GameUpdate
from repositories import gameRepository
from schemas.gameSchemas import GameSearchResult
from services.steamService import get_game_details, search_steam_store

# Retorna candidatos
async def search_games(
    session: Session,
    query: str,
    limit: int = 20,
) -> tuple[list[GameSearchResult], str]:
    query = query.strip()
    if not query:
        return [], "local"

    local = gameRepository.get_games(session, q=query, limit=limit, offset=0)
    local_results = [
        GameSearchResult(
            id=game.id,
            title=game.title,
            steam_appid=game.steam_appid,
            cover=game.cover,
        )
        for game in local
        if game.steam_appid is not None
    ]
    if local_results:
        return local_results, "server"

    steam_results = await search_steam_store(query, limit=limit)
    candidates: list[GameSearchResult] = []
    for item in steam_results:
        existing = gameRepository.get_game_by_steam_appid(session, item["appid"])
        candidates.append(
            GameSearchResult(
                id=existing.id if existing else None,
                title=item["name"],
                steam_appid=item["appid"],
                cover=item.get("header_image"),
            )
        )

    return candidates, "steam"

# Persiste somente o AppID escolhido pelo usuário
async def resolve_game(session: Session, steam_appid: int) -> Game:
    existing = gameRepository.get_game_by_steam_appid(session, steam_appid)
    details = await get_game_details(steam_appid)

    if not details:
        if existing and existing.is_active:
            return existing
        raise ValueError("Jogo não encontrado na Steam")

    game_data = GameCreate(**details)
    return gameRepository.create_game(session, game_data)

# Criar Jogo
def create_game(session: Session, game: GameCreate) -> Game:
    return gameRepository.create_game(session, game)

# Obter todos os jogos persistidos
def get_games(session: Session, q: str | None = None, limit: int = 25, offset: int = 0) -> list[Game]:
    return gameRepository.get_games(session=session, q=q, limit=limit, offset=offset)

# Obter jogo persistido pelo ID interno
def get_game_by_id(session: Session, game_id: int) -> Game | None:
    return gameRepository.get_game_by_id(session, game_id)

# Atualizar os metadados do jogo persistido pelo ID interno
def update_game(session: Session, game_id: int, game_update: GameUpdate) -> Game | None:
    return gameRepository.update_game(session, game_id, game_update)

# deletar jogo persistido pelo ID interno
def delete_game(session: Session, game_id: int) -> bool:
    return gameRepository.delete_game(session, game_id)
