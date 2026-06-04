from typing import Optional, List
from sqlmodel import Session

from models.games import Game, GameCreate, GameUpdate
from repositories import games as game_repository

def get_games(
    session: Session,
    q: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
) -> List[Game]:

    tag_list: Optional[List[str]] = None

    if tags:
        tag_list = [
            t.strip().lower()
            for t in tags.split(",")
            if t.strip()
        ]

    return game_repository.get_games(
        session=session,
        q=q,
        tags=tag_list,
        limit=limit,
        offset=offset
    )

# Bucar jogo com base no ID
def get_game_by_id(session: Session, game_id: int) -> Optional[Game]:
    return game_repository.get_game_by_id(session, game_id)

# Cria jogo
def create_game(session: Session, game: GameCreate) -> Game:
    return game_repository.create_game(session, game)

# Atulizar Jogo
def update_game(
    session: Session,
    game_id: int,
    game_update: GameUpdate
) -> Game | None:

    return game_repository.update_game(
        session=session,
        game_id=game_id,
        game_data=game_update
    )