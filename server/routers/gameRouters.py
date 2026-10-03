from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import get_session
from models.gameModels import Game, GameCreate, GameUpdate
from services import gameService
from services.steamService import get_game_details

router = APIRouter(prefix="/games", tags=["Games"])


def _serialize(game: Game) -> dict:
    return game.model_dump()


@router.get("/")
def get_games(
    q: str | None = Query(None, description="Busca por título ou descrição"),
    limit: int = Query(25, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
):
    games = gameService.get_games(session=session, q=q, limit=limit, offset=offset)
    return [_serialize(game) for game in games]


@router.get("/steam/{appid}/metadata")
async def get_steam_metadata(appid: int):
    """Obtém metadados públicos da Steam sem acessar arquivos locais."""
    try:
        details = await get_game_details(appid)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Não foi possível consultar a Steam: {exc}",
        ) from exc

    if not details:
        raise HTTPException(status_code=404, detail="Jogo não encontrado na Steam")

    return details


@router.get("/{game_id}")
def get_game_by_id(game_id: int, session: Session = Depends(get_session)):
    game = gameService.get_game_by_id(session, game_id)
    if not game or not game.is_active:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return _serialize(game)


@router.post("/", status_code=201)
async def create_game(game: GameCreate, session: Session = Depends(get_session)):
    # Se houver Steam App ID, tenta completar os metadados automaticamente.
    if game.steam_appid:
        try:
            details = await get_game_details(game.steam_appid)
            if details:
                game.title = details.get("title") or game.title
                game.description = details.get("description") or game.description
                game.cover = details.get("cover") or game.cover
                game.background = details.get("background") or game.background
                game.genres = details.get("genres") or game.genres
        except Exception:
            # O cadastro continua funcionando mesmo sem a Steam.
            pass

    new_game = gameService.create_game(session, game)
    return _serialize(new_game)


@router.put("/{game_id}")
def update_game(
    game_id: int,
    game_update: GameUpdate,
    session: Session = Depends(get_session),
):
    updated = gameService.update_game(session, game_id, game_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return _serialize(updated)


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, session: Session = Depends(get_session)):
    if not gameService.delete_game(session, game_id):
        raise HTTPException(status_code=404, detail="Game não encontrado")
