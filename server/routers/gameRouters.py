from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import get_session
from models.gameModels import Game, GameCreate, GameUpdate
from schemas.gameSchemas import GameResolveRequest, GameResponse, GameSearchResponse
from services import gameService
from services.steamService import get_game_details

router = APIRouter(prefix="/games", tags=["Games"])


# Pesquisa candidatos
@router.get("/search", response_model=GameSearchResponse)
async def search_games(
    q: str = Query(..., min_length=1, description="Nome ou parte do nome do jogo"),
    limit: int = Query(20, ge=1, le=20),
    session: Session = Depends(get_session),
):
    
    try:
        games, source = await gameService.search_games(session, q, limit)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Não foi possível realizar a pesquisa: {exc}",
        ) from exc

    return {
        "source": source,
        "results": [game.model_dump() for game in games],
    }

# Consulta metadados sem persistir o jogo
@router.get("/steam/{appid}/metadata")
async def get_steam_metadata(appid: int):

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


# Obter lista de jogos persistidos
@router.get("/", response_model=list[GameResponse])
def get_games(
    q: str | None = Query(None, description="Busca apenas no catálogo global"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
):
    games = gameService.get_games(session=session, q=q, limit=limit, offset=offset)
    return games


# Resolve e persiste somente o jogo selecionado pelo usuário
@router.post("/resolve", response_model=GameResponse, status_code=201)
async def resolve_selected_game(
    request: GameResolveRequest,
    session: Session = Depends(get_session),
):
    try:
        game = await gameService.resolve_game(session, request.steam_appid)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Não foi possível resolver o jogo: {exc}",
        ) from exc
    return game


# Compatibilidade: com steam_appid, trata o AppID como seleção explícita
@router.post("/", response_model=GameResponse, status_code=201)
async def create_game(game: GameCreate, session: Session = Depends(get_session)):
    if game.steam_appid is not None:
        try:
            return await gameService.resolve_game(session, game.steam_appid)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Não foi possível resolver os dados do jogo: {exc}",
            ) from exc

    return gameService.create_game(session, game)


# Obter os dados do jogo persistido pelo ID interno
@router.get("/{game_id}", response_model=GameResponse)
def get_game_by_id(game_id: int, session: Session = Depends(get_session)):
    game = gameService.get_game_by_id(session, game_id)
    if not game or not game.is_active:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return game


# Atualiza os metadados do jogo persistido pelo ID interno
@router.put("/{game_id}", response_model=GameResponse)
def update_game(
    game_id: int,
    game_update: GameUpdate,
    session: Session = Depends(get_session),
):
    updated = gameService.update_game(session, game_id, game_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Game não encontrado")
    return updated


# Deletar Jogo
@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, session: Session = Depends(get_session)):
    if not gameService.delete_game(session, game_id):
        raise HTTPException(status_code=404, detail="Game não encontrado")
