import httpx
from bs4 import BeautifulSoup


# URLs da Steam
STEAM_STORE_SEARCH_URL = "https://store.steampowered.com/search/"
STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails"
STEAM_API_BASE = "https://api.steampowered.com"


async def search_steam_store(query: str):
    query = query.strip()

    if not query:
        return []

    params = {
        "term": query,
        "cc": "br",
        "l": "portuguese",
    }

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"
        ),
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    }

    async with httpx.AsyncClient(
        headers=headers,
        follow_redirects=True,
        timeout=15.0,
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

        if not appid or not name_element:
            continue

        # Alguns resultados podem conter mais de um AppID
        app_id = str(appid).split(",")[0]

        try:
            app_id_int = int(app_id)
        except ValueError:
            continue

        header_image = None

        if image_element:
            header_image = (
                image_element.get("data-src")
                or image_element.get("src")
            )

        if not header_image:
            header_image = (
                "https://shared.cloudflare.steamstatic.com/"
                f"store_item_assets/steam/apps/{app_id}/header.jpg"
            )

        results.append({
            "appid": app_id_int,
            "name": name_element.get_text(strip=True),
            "header_image": header_image,
        })

    return results[:20]

async def get_game_details(appid: int):

    params = {
        "appids": appid,
        "cc": "br",
        "l": "portuguese",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
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

    return {
        "steam_appid": game["steam_appid"],
        "title": game["name"],
        "description": game.get("short_description"),
        "cover": game.get("header_image"),
        "background": game.get("background_raw"),
    }


