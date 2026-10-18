from collections import defaultdict
from datetime import datetime, timezone

from sqlmodel import Session, select

from models.game_session import GameSession
from models.games import Game

# Tag padrão de jogos sem gênero definido não conta como gênero jogado.
GENERIC_TAGS = {"pc game"}
TOP_SIZE = 5


def _local(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone()


def _top(seconds_by_key: dict, limit: int = TOP_SIZE):
    return sorted(seconds_by_key.items(), key=lambda item: item[1], reverse=True)[:limit]


def build_capsule(session: Session, year: int) -> dict:
    sessions = session.exec(
        select(GameSession).where(
            GameSession.ativa == False,  # noqa: E712
            GameSession.duracao_segundos != None,  # noqa: E711
        )
    ).all()
    games = {g.id: g for g in session.exec(select(Game)).all()}
    genres_of = {
        gid: [t.name for t in game.tags if t.name.strip().lower() not in GENERIC_TAGS]
        for gid, game in games.items()
    }

    years: set[int] = {datetime.now().year}
    game_secs = {m: defaultdict(int) for m in range(1, 13)}
    genre_secs = {m: defaultdict(int) for m in range(1, 13)}
    totals = {m: 0 for m in range(1, 13)}
    counts = {m: 0 for m in range(1, 13)}

    for row in sessions:
        started = _local(row.iniciada_em)
        years.add(started.year)
        if started.year != year or row.game_id not in games:
            continue
        seconds = max(0, row.duracao_segundos or 0)
        month = started.month
        totals[month] += seconds
        counts[month] += 1
        game_secs[month][row.game_id] += seconds
        for genre in genres_of[row.game_id]:
            genre_secs[month][genre] += seconds

    def game_item(game_id: int, seconds: int) -> dict:
        game = games[game_id]
        return {
            "id": game.id,
            "title": game.title,
            "cover": game.vertical_cover or game.cover,
            "seconds": seconds,
        }

    def summarize(game_totals: dict, genre_totals: dict, total: int, count: int) -> dict:
        return {
            "total_seconds": total,
            "sessions": count,
            "top_games": [game_item(gid, s) for gid, s in _top(game_totals)],
            "top_genres": [{"name": n, "seconds": s} for n, s in _top(genre_totals)],
        }

    year_games: dict = defaultdict(int)
    year_genres: dict = defaultdict(int)
    for month in range(1, 13):
        for gid, s in game_secs[month].items():
            year_games[gid] += s
        for name, s in genre_secs[month].items():
            year_genres[name] += s

    return {
        "year": year,
        "years_available": sorted(years, reverse=True),
        "months": [
            {"month": m, **summarize(game_secs[m], genre_secs[m], totals[m], counts[m])}
            for m in range(1, 13)
        ],
        "year_summary": summarize(year_games, year_genres, sum(totals.values()), sum(counts.values())),
    }
