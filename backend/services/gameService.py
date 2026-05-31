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

    # 2. CORREÇÃO: Filtragem por texto usando as propriedades corretas (title e description)
    if q:
        q_lower = q.lower()  # Removidos os caracteres "%" que quebravam o "in" do Python
        games = [
            g for g in games
            if q_lower in (g.title or "").lower() or q_lower in (g.description or "").lower()
        ]

    # 3. Filtro por tags
    if tags:
        tags_set = {t.strip().lower() for t in tags.split(",")}

        games = [
            g for g in games
            if tags_set.issubset({t.lower() for t in (g.tags or [])})
        ]

    # 4. Paginação
    return games[offset: offset + limit]