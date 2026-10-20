from collections import defaultdict
import unicodedata

from sqlmodel import Session

from repositories import games as game_repository
from repositories import game_session as game_session_repository
from services.steamService import get_game_details, search_steam_store


# IDs de tags públicas da busca da Steam para os gêneros mais comuns.
STEAM_TAGS = {
    "action": 19, "adventure": 21, "rpg": 122, "strategy": 9,
    "simulation": 599, "sports": 701, "racing": 699, "indie": 492,
    "casual": 597, "horror": 1667, "puzzle": 1664, "shooter": 1774,
    "platformer": 1625, "survival": 1662, "sandbox": 3810, "roguelike": 1716,
    "fighting": 1743, "stealth": 1687, "openworld": 1695, "multiplayer": 3859,
    "coop": 1685, "scifi": 3942, "fantasy": 1684, "anime": 4085,
}
GENRE_ALIASES = {
    "acao": "action", "aventura": "adventure", "estrategia": "strategy",
    "simulacao": "simulation", "esportes": "sports", "corrida": "racing",
    "independente": "indie", "casual": "casual", "terror": "horror",
    "quebracabeca": "puzzle", "tiro": "shooter",
    "plataforma": "platformer", "sobrevivencia": "survival",
    "luta": "fighting", "furtivo": "stealth", "mundoaberto": "openworld",
    "multijogador": "multiplayer", "cooperativo": "coop",
    "ficcaocientifica": "scifi", "fantasia": "fantasy",
    "gratuitoparajogar": "casual", "freetoplay": "casual",
    "multijogadormassivo": "multiplayer", "massivelymultiplayer": "multiplayer",
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


async def build_friends_recommendations_from_games(
    session: Session,
    friend_games: list[dict],
    limit: int = 8,
) -> dict:
    local_games = game_repository.get_games(session, limit=10_000, offset=0)
    owned_steam_ids = {
        game.steam_appid for game in local_games if game.is_active and game.steam_appid
    }

    sorted_friend_games = sorted(
        friend_games,
        key=lambda item: int(item.get("weight") or 0),
        reverse=True,
    )

    based_on_games: list[str] = []
    friend_steam_ids: set[int] = set()
    genre_seconds: dict[str, int] = defaultdict(int)
    genre_names: dict[str, str] = {}

    for item in sorted_friend_games[:6]:
        title = str(item.get("title") or "").strip()
        if title and title not in based_on_games and len(based_on_games) < 3:
            based_on_games.append(title)
        appid = item.get("steam_appid")
        if isinstance(appid, int) and appid > 0:
            friend_steam_ids.add(appid)

        genres = [str(g) for g in (item.get("genres") or []) if g]
        if not genres:
            try:
                target_appid = appid if isinstance(appid, int) and appid > 0 else None
                if not target_appid and title:
                    matches = await search_steam_store(query=title)
                    if matches:
                        target_appid = matches[0]["appid"]
                        friend_steam_ids.add(target_appid)
                if target_appid:
                    details = await get_game_details(target_appid)
                    if details and details.get("genres"):
                        genres = details["genres"]
            except Exception:
                pass

        weight = max(int(item.get("weight") or 60), 60)
        for g_name in genres:
            key = _genre_key(g_name)
            if key not in STEAM_TAGS:
                continue
            genre_names[key] = g_name
            genre_seconds[key] += weight

    top_genres = sorted(
        genre_seconds,
        key=lambda k: genre_seconds[k],
        reverse=True,
    )[:3]

    blocked_appids = owned_steam_ids | friend_steam_ids
    candidates: list[dict] = []
    seen: set[int] = set()

    for genre_key in top_genres:
        try:
            results = await search_steam_store(tag_ids=[STEAM_TAGS[genre_key]])
        except Exception:
            continue
        for game in results:
            appid = game["appid"]
            if appid in blocked_appids or appid in seen:
                continue
            seen.add(appid)
            candidates.append(
                {
                    "steam_appid": appid,
                    "title": game["name"],
                    "cover": game["header_image"],
                    "genres": [genre_names[genre_key]],
                }
            )
            if len(candidates) >= limit:
                break
        if len(candidates) >= limit:
            break

    if len(candidates) < limit:
        for title in based_on_games:
            try:
                results = await search_steam_store(query=title)
            except Exception:
                continue
            norm_title = "".join(c for c in title.lower() if c.isalnum())
            for game in results:
                appid = game["appid"]
                item_norm = "".join(c for c in game["name"].lower() if c.isalnum())
                if appid in blocked_appids or appid in seen or item_norm == norm_title:
                    continue
                seen.add(appid)
                candidates.append(
                    {
                        "steam_appid": appid,
                        "title": game["name"],
                        "cover": game["header_image"],
                        "genres": [genre_names[k] for k in top_genres[:1]] or [f"Similar a {title}"],
                    }
                )
                if len(candidates) >= limit:
                    break
            if len(candidates) >= limit:
                break

    return {
        "based_on_games": based_on_games,
        "based_on_tags": [genre_names[k] for k in top_genres],
        "recommendations": candidates[:limit],
    }
