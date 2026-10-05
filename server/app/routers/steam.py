import httpx
from fastapi import APIRouter, Query, HTTPException
from app.security import CurrentUser
from app.service import steam

router = APIRouter(prefix="/steam", tags=["Steam"])

@router.get("/games/search")
async def search(user: CurrentUser, query: str = Query(min_length=1, max_length=150)):
    try:
        return await steam.search_steam_store(query)
    except (httpx.HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível consultar a Steam")

@router.get("/games/{appid}")
async def details(appid: int, user: CurrentUser):
    if appid <= 0:
        raise HTTPException(422, "AppID inválido")
    try:
        data = await steam.get_game_details(appid)
    except (httpx.HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível consultar a Steam")
    if data is None:
        raise HTTPException(404, "Jogo não encontrado na Steam")
    return data
