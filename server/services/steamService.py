from typing import Any

import httpx


async def get_game_details(appid: int) -> dict[str, Any] | None:
    url = "https://store.steampowered.com/api/appdetails"
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(url, params={"appids": appid, "l": "english"})
        response.raise_for_status()
        data = response.json().get(str(appid), {})
        if not data.get("success"):
            return None
        game = data.get("data", {})
        genres = ", ".join(g.get("description", "") for g in game.get("genres", []))
        return {
            "title": game.get("name"),
            "description": game.get("short_description"),
            "cover": game.get("header_image"),
            "background": game.get("background"),
            "genres": genres,
        }
