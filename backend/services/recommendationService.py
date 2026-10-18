from collections import defaultdict
import unicodedata

from sqlmodel import Session

from repositories import games as game_repository
from repositories import game_session as game_session_repository
from services.steamService import search_steam_store


# IDs de tags públicas da busca da Steam para os gêneros mais comuns.
STEAM_TAGS = {
    "action": 19, "adventure": 21, "rpg": 122, "strategy": 9,
    "simulation": 599, "sports": 701, "racing": 699, "indie": 492,
    "casual": 597, "horror": 1667, "puzzle": 1664, "shooter": 1774,
}
GENRE_ALIASES = {
    "acao": "action", "aventura": "adventure", "estrategia": "strategy",
    "simulacao": "simulation", "esportes": "sports", "corrida": "racing",
    "independente": "indie", "casual": "casual", "terror": "horror",
    "quebracabeca": "puzzle", "tiro": "shooter",
}


def _genre_key(name: str) -> str:
    normalized = unicodedata.normalize("NFD", name.lower())
    key = "".join(char for char in normalized if char.isalnum() and not unicodedata.combining(char))
    return GENRE_ALIASES.get(key, key)


async def build_recommendations(session: Session, limit: int = 8) -> dict:
    games = game_repository.get_games(session, limit=10_000, offset=0)
    active_games = [game for game in games if game.is_active]
    durations = defaultdict(int)
    for game_session in game_session_repository.get_all_sessions(session):
        durations[game_session.game_id] += game_session.duracao_segundos or 0

    genre_seconds: dict[str, int] = defaultdict(int)
    genre_names: dict[str, str] = {}
    owned_steam_ids = {game.steam_appid for game in active_games if game.steam_appid}
    for game in active_games:
        consumption = max(game.play_time, durations[game.id])
        for tag in game.tags:
            key = _genre_key(tag.name)
            if key not in STEAM_TAGS:
                continue
            genre_names[key] = tag.name
            genre_seconds[key] += consumption

    ranked = sorted(genre_seconds, key=lambda key: genre_seconds[key], reverse=True)
    favorites = ranked[:2]
    least_played = list(reversed(ranked))[:2]

    async def fetch_games(genre_keys: list[str]) -> list[dict]:
        candidates: list[dict] = []
        seen: set[int] = set()
        for genre_key in genre_keys:
            try:
                results = await search_steam_store(tag_ids=[STEAM_TAGS[genre_key]])
            except Exception:
                continue
            for game in results:
                if game["appid"] in owned_steam_ids or game["appid"] in seen:
                    continue
                seen.add(game["appid"])
                candidates.append({
                    "steam_appid": game["appid"],
                    "title": game["name"],
                    "cover": game["header_image"],
                    "genres": [genre_names[genre_key]],
                })
                if len(candidates) >= limit:
                    return candidates
        return candidates

    return {
        "based_on": [genre_names[key] for key in favorites],
        "recommendations": await fetch_games(favorites),
        "explore_genres": [genre_names[key] for key in least_played],
        "explore": await fetch_games(least_played),
    }
