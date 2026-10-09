import re
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup


# URLs da Steam

STEAM_API_BASE = "https://api.steampowered.com"
STEAM_STORE_SEARCH_URL = "https://store.steampowered.com/search/"
STEAM_APP_DETAILS_URL = (
    "https://store.steampowered.com/api/appdetails"
)


async def search_steam_store(query: str):
    params = {"term": query.strip()}

    async with httpx.AsyncClient(
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
        follow_redirects=True,
        timeout=15,
    ) as client:
        response = await client.get(
            STEAM_STORE_SEARCH_URL,
            params=params,
        )

    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    results = []

    for game in soup.select("a.search_result_row"):

        appid = game.get("data-ds-appid")
        name_element = game.select_one(".title")
        image_element = game.select_one("img")
        app_id = str(appid).split(",")[0]

        if not appid or not name_element:
            continue

        results.append({
            "appid": int(app_id),
            "name": name_element.get_text(strip=True),
            "header_image": (
                image_element.get("data-src")
                or image_element.get("src")
                if image_element
                else None
            ) or (
                f"https://shared.cloudflare.steamstatic.com/store_item_assets/"
                f"steam/apps/{app_id}/header.jpg"
            ),
        })

    return results[:20]

async def get_game_details(appid: int):

    params = {
        "appids": appid,
        "cc": "br",
        "l": "portuguese",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            STEAM_APP_DETAILS_URL,
            params=params,
        )

    response.raise_for_status()

    data = response.json()

    app_data = data.get(str(appid))

    if not app_data or not app_data.get("success"):
        return None

    game = app_data["data"]

    vertical_cover = (
        "https://shared.cloudflare.steamstatic.com/"
        f"store_item_assets/steam/apps/{appid}/library_600x900.jpg"
    )

    return {
        "steam_appid": game["steam_appid"],
        "title": game["name"],
        "description": game.get("short_description"),
        "cover": game.get("header_image"),
        "vertical_cover": vertical_cover,
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