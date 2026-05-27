from typing import Optional, List
from sqlmodel import Session
from models.games import Game
from repositories import games as game_repo

def listar_games_service(
        session: Session,
        q: Optional[str] = None,
        tags: Optional[str] = None,
        limit: int = 25,
        offset: int = 0,
) -> List[Game]:
    
    # 1. Buscar todos os jogos
    games = game_repo.get_all_games_2(session)

    # 2. Filtrar por texto <- estado anterior a chamada de dados
    if q:
        q_lower = f"%{q.lower()}%"
        games = [
        g for g in games
        if q_lower in (g.nome or "").lower()
        or q_lower in (g.descricao or "").lower()]

    # 3. Filtro por tags
    if tags:
        tags_set = {t.strip().lower() for t in tags.split(",")}

        games = [
            g for g in games
            if tags_set.issubset({t.lower() for t in (g.tags or [])})
        ]

    # 4. Paginação
    return games[offset: offset + limit]