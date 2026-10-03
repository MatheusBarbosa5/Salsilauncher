from typing import Any

import httpx
from bs4 import BeautifulSoup

STEAM_STORE_SEARCH_URL = "https://store.steampowered.com/search/"
STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails"

# Pesquisa candidatos na Steam sem persistir nenhum deles
async def search_steam_store(query: str, limit: int = 20) -> list[dict[str, Any]]:
    query = query.strip()
    if not query:
        return []

    params = {"term": query, "cc": "br", "l": "portuguese"}
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"
        ),
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    }

    async with httpx.AsyncClient(
        headers=headers, follow_redirects=True, timeout=15.0
    ) as client:
        response = await client.get(STEAM_STORE_SEARCH_URL, params=params)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    results: list[dict[str, Any]] = []
    seen_appids: set[int] = set()

    for item in soup.select("a.search_result_row"):
        raw_appid = item.get("data-ds-appid")
        title_element = item.select_one(".title")
        image_element = item.select_one("img")

        if not raw_appid or not title_element:
            continue

        try:
            appid = int(str(raw_appid).split(",")[0])
        except ValueError:
            continue

        if appid in seen_appids:
            continue
        seen_appids.add(appid)

        image = None
        if image_element:
            image = image_element.get("data-src") or image_element.get("src")
        if not image:
            image = (
                "https://shared.cloudflare.steamstatic.com/"
                f"store_item_assets/steam/apps/{appid}/header.jpg"
            )

        results.append(
            {
                "appid": appid,
                "name": title_element.get_text(strip=True),
                "header_image": image,
            }
        )

        if len(results) >= limit:
            break

    return results

# Obter detalhes do jogo na Steam
async def get_game_details(appid: int) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            STEAM_APP_DETAILS_URL,
            params={"appids": appid, "cc": "br", "l": "portuguese"},
        )
        response.raise_for_status()

    data = response.json().get(str(appid), {})
    if not data.get("success"):
        return None

    game = data.get("data", {})
    genres = [g["description"] for g in game.get("genres", []) if g.get("description")]
    screenshots = [
        shot["path_full"]
        for shot in game.get("screenshots", [])
        if shot.get("path_full")
    ]

    return {
        "steam_appid": game.get("steam_appid", appid),
        "title": game.get("name"),
        "description": game.get("short_description"),
        "cover": game.get("header_image"),
        "background": game.get("background_raw") or game.get("background"),
        "extra_images": screenshots,
        "genres": genres,
    }
