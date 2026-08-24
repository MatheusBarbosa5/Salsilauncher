from fastapi import APIRouter

from services.steamService import (
    search_steam_store,
    get_game_details,
)

router = APIRouter(
    prefix="/steam",
    tags=["Steam"]
)



@router.get("/games/search")
async def search_games(query: str):

    return await search_steam_store(query)

@router.get("/games/{appid}")
async def get_game(appid: int):

    game = await get_game_details(appid)

    if game is None:
        return {
            "message": "Jogo não encontrado"
        }

    return game