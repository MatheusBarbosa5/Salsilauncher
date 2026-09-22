import re
from urllib.parse import urlparse

import httpx


# URL Bases

STEAM_API_KEY = "1EFB19FB74E04373822438719CD0AC4A"  # Adicionar em um ENV

STEAM_STORE_SEARCH_URL = "https://store.steampowered.com/api/storesearch/"
STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails"
STEAM_API_BASE = "https://api.steampowered.com"


# Buscar e detalhes dos jogos

async def search_steam_store(query: str) -> list[dict]:

    params = {
        "term": query.strip(),
        "l": "portuguese",
        "cc": "br",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(STEAM_STORE_SEARCH_URL, params=params)

    response.raise_for_status()

    data = response.json()
    items = data.get("items", [])

    results = []
    for item in items:
        appid = item.get("id")
        if appid is None:
            continue

        results.append({
            "appid": int(appid),
            "name": item.get("name", ""),
            "header_image": (
                item.get("tiny_image")
                or f"https://shared.cloudflare.steamstatic.com/store_item_assets/"
                   f"steam/apps/{appid}/header.jpg"
            ),
        })

    return results[:20]


async def get_game_details(appid: int) -> dict | None:
    params = {
        "appids": appid,
        "cc": "br",
        "l": "portuguese",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(STEAM_APP_DETAILS_URL, params=params)

    response.raise_for_status()

    data = response.json()
    
    app_data = data.get(str(appid))

    if not app_data or not app_data.get("success"):
        return None

    game = app_data["data"]

    return {
        "steam_appid": game["steam_appid"],
        "title": game["name"],
        "description": game.get("short_description"),
        "cover": game.get("header_image"),
        "background": game.get("background_raw"),
    }


## Perfil Steam

# Transforma a URL do perfil Steam em SteamID64. Padrão e vanity
async def resolve_steam_profile(profile_url: str) -> dict:
    profile_url = profile_url.strip()

    parsed = urlparse(profile_url)
    if "steamcommunity.com" not in parsed.netloc:
        raise ValueError("URL inválida. Deve ser um perfil da Steam Community.")

    path = parsed.path.strip("/")

    # Caso 1: /profiles/7656119... Número já é o SteamID64
    match_profile = re.match(r"profiles/(\d+)", path)
    if match_profile:
        return {
            "steam_id": match_profile.group(1),
            "profile_url": profile_url,
            "type": "profile",
        }

    # Caso 2: /id/vanityname  | Necessita de tratamento
    match_vanity = re.match(r"id/([a-zA-Z0-9_-]+)", path)
    if match_vanity:
        steam_id = await _resolve_vanity_url(match_vanity.group(1))
        return {
            "steam_id": steam_id,
            "profile_url": profile_url,
            "type": "vanity",
        }

    raise ValueError("Formato de URL Steam não reconhecido.")


# Resolve um vanity name (apelido) para SteamID64 via API oficial.
async def _resolve_vanity_url(vanity: str) -> str:

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/",
            params={"key": STEAM_API_KEY, "vanityurl": vanity},
        )

    response.raise_for_status()
    data = response.json()
    result = data.get("response", {})

    if result.get("success") != 1:
        raise ValueError(f"Não foi possível resolver o perfil Steam '{vanity}'.")

    return str(result["steamid"])


# Busca os jogos da conta Steam via API oficial e normaliza
async def get_owned_games(steam_id: str) -> list[dict]:

    url = f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/"

    params = {
        "key": STEAM_API_KEY,
        "steamid": steam_id,
        "include_appinfo": 1,
        "include_played_free_games": 1,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    games_raw = data.get("response", {}).get("games", [])

    return [
        {
            "steam_appid": g["appid"],
            "title": g.get("name", f"App {g['appid']}"),
            "cover": f"https://cdn.cloudflare.steamstatic.com/steam/apps/{g['appid']}/header.jpg",
            "background": None,
        }
        for g in games_raw
    ]