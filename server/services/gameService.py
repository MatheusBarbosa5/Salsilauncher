from collections import defaultdict
import unicodedata
from sqlalchemy import or_
from sqlmodel import Session, select

from models.gameModels import Game, GameCreate, GameUpdate
from models.socialModels import Collection, CollectionGame, Friendship, PlaySession, Rating
from models.UsersModels import User
from repositories import gameRepository
from schemas.gameSchemas import GameSearchResult
from services.steamService import get_game_details, search_steam_store

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


# Retorna candidatos
async def search_games(
    session: Session,
    query: str,
    limit: int = 20,
) -> tuple[list[GameSearchResult], str]:
    query = query.strip()
    if not query:
        return [], "local"

    local = gameRepository.get_games(session, q=query, limit=limit, offset=0)
    local_results = [
        GameSearchResult(
            id=game.id,
            title=game.title,
            steam_appid=game.steam_appid,
            cover=game.cover,
        )
        for game in local
        if game.steam_appid is not None
    ]
    if local_results:
        return local_results, "server"

    steam_results = await search_steam_store(query, limit=limit)
    candidates: list[GameSearchResult] = []
    for item in steam_results:
        existing = gameRepository.get_game_by_steam_appid(session, item["appid"])
        candidates.append(
            GameSearchResult(
                id=existing.id if existing else None,
                title=item["name"],
                steam_appid=item["appid"],
                cover=item.get("header_image"),
            )
        )

    return candidates, "steam"

# Persiste somente o AppID escolhido pelo usuário
async def resolve_game(session: Session, steam_appid: int) -> Game:
    existing = gameRepository.get_game_by_steam_appid(session, steam_appid)
    details = await get_game_details(steam_appid)

    if not details:
        if existing and existing.is_active:
            return existing
        raise ValueError("Jogo não encontrado na Steam")

    game_data = GameCreate(**details)
    return gameRepository.create_game(session, game_data)

# Criar Jogo
def create_game(session: Session, game: GameCreate) -> Game:
    return gameRepository.create_game(session, game)

# Obter todos os jogos persistidos
def get_games(session: Session, q: str | None = None, limit: int = 25, offset: int = 0) -> list[Game]:
    return gameRepository.get_games(session=session, q=q, limit=limit, offset=offset)

# Obter jogo persistido pelo ID interno
def get_game_by_id(session: Session, game_id: int) -> Game | None:
    return gameRepository.get_game_by_id(session, game_id)

# Atualizar os metadados do jogo persistido pelo ID interno
def update_game(session: Session, game_id: int, game_update: GameUpdate) -> Game | None:
    return gameRepository.update_game(session, game_id, game_update)

# deletar jogo persistido pelo ID interno
def delete_game(session: Session, game_id: int) -> bool:
    return gameRepository.delete_game(session, game_id)


async def build_friends_recommendations(
    session: Session,
    user_id: int,
    exclude_appids: set[int] | None = None,
    limit: int = 8,
) -> dict:
    friendships = session.exec(
        select(Friendship).where(
            Friendship.status == "accepted",
            or_(Friendship.user_id == user_id, Friendship.friend_id == user_id),
        )
    ).all()
    raw_friend_ids = [
        f.friend_id if f.user_id == user_id else f.user_id
        for f in friendships
    ]
    if not raw_friend_ids:
        return {
            "has_friends": False,
            "based_on_games": [],
            "based_on_tags": [],
            "recommendations": [],
        }

    active_friends = session.exec(
        select(User.id).where(
            User.id.in_(raw_friend_ids),
            User.is_active == True,
            User.is_banned == False,
        )
    ).all()
    friend_ids = list(active_friends)
    if not friend_ids:
        return {
            "has_friends": False,
            "based_on_games": [],
            "based_on_tags": [],
            "recommendations": [],
        }

    game_weights: dict[int, int] = defaultdict(int)
    friend_sessions = session.exec(
        select(PlaySession).where(PlaySession.user_id.in_(friend_ids))
    ).all()
    for ps in friend_sessions:
        game_weights[ps.game_id] += max(ps.duration_seconds or 0, 60)

    friend_ratings = session.exec(
        select(Rating).where(Rating.user_id.in_(friend_ids))
    ).all()
    for r in friend_ratings:
        game_weights[r.game_id] += max(r.score * 60, 120)

    friend_collections = session.exec(
        select(Collection.id).where(Collection.user_id.in_(friend_ids))
    ).all()
    if friend_collections:
        col_games = session.exec(
            select(CollectionGame).where(
                CollectionGame.collection_id.in_(list(friend_collections))
            )
        ).all()
        for cg in col_games:
            game_weights[cg.game_id] += 120

    if not game_weights:
        return {
            "has_friends": True,
            "based_on_games": [],
            "based_on_tags": [],
            "recommendations": [],
        }

    user_sessions = session.exec(
        select(PlaySession.game_id).where(PlaySession.user_id == user_id)
    ).all()
    user_game_ids = set(user_sessions)
    user_steam_ids: set[int] = set(exclude_appids or set())
    if user_game_ids:
        user_games = session.exec(
            select(Game).where(Game.id.in_(list(user_game_ids)))
        ).all()
        for ug in user_games:
            if ug.steam_appid:
                user_steam_ids.add(ug.steam_appid)

    friend_games = session.exec(
        select(Game).where(
            Game.id.in_(list(game_weights.keys())),
            Game.is_active == True,
        )
    ).all()
    ranked_games = sorted(
        friend_games,
        key=lambda g: game_weights.get(g.id or 0, 0),
        reverse=True,
    )

    based_on_games: list[str] = []
    friend_steam_ids: set[int] = set()
    genre_seconds: dict[str, int] = defaultdict(int)
    genre_names: dict[str, str] = {}

    for game in ranked_games[:6]:
        if game.title and game.title not in based_on_games and len(based_on_games) < 3:
            based_on_games.append(game.title)
        if game.steam_appid:
            friend_steam_ids.add(game.steam_appid)

        genres = list(game.genres or [])
        if not genres:
            try:
                appid = game.steam_appid
                if not appid and game.title:
                    matches = await search_steam_store(game.title, limit=1)
                    if matches:
                        appid = matches[0]["appid"]
                        friend_steam_ids.add(appid)
                if appid:
                    details = await get_game_details(appid)
                    if details and details.get("genres"):
                        genres = details["genres"]
                        game.genres = genres
                        session.add(game)
                        session.commit()
            except Exception:
                pass

        weight = max(game_weights.get(game.id or 0, 0), 60)
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

    blocked_appids = user_steam_ids | friend_steam_ids
    candidates: list[dict] = []
    seen: set[int] = set()

    for genre_key in top_genres:
        try:
            results = await search_steam_store(
                tag_ids=[STEAM_TAGS[genre_key]],
                limit=20,
            )
        except Exception:
            continue
        for item in results:
            appid = item["appid"]
            if appid in blocked_appids or appid in seen:
                continue
            seen.add(appid)
            candidates.append(
                {
                    "steam_appid": appid,
                    "title": item["name"],
                    "cover": item["header_image"],
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
                results = await search_steam_store(query=title, limit=10)
            except Exception:
                continue
            norm_title = "".join(c for c in title.lower() if c.isalnum())
            for item in results:
                appid = item["appid"]
                item_norm = "".join(c for c in item["name"].lower() if c.isalnum())
                if appid in blocked_appids or appid in seen or item_norm == norm_title:
                    continue
                seen.add(appid)
                candidates.append(
                    {
                        "steam_appid": appid,
                        "title": item["name"],
                        "cover": item["header_image"],
                        "genres": [genre_names[k] for k in top_genres[:1]] or [f"Similar a {title}"],
                    }
                )
                if len(candidates) >= limit:
                    break
            if len(candidates) >= limit:
                break

    return {
        "has_friends": True,
        "based_on_games": based_on_games,
        "based_on_tags": [genre_names[k] for k in top_genres],
        "recommendations": candidates[:limit],
    }
