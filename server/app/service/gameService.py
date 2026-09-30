from typing import Optional, List

from sqlmodel import Session

from models.gameModels import Game, GameCreate, GameUpdate
from repositories import games as game_repository


# Obter jogos
def get_games(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
) -> List[Game]:

    return game_repository.get_games(
        session=session,
        q=q,
        limit=limit,
        offset=offset
    )


# Buscar jogo pelo ID
def get_game_by_id(
    session: Session,
    game_id: int
) -> Optional[Game]:

    return game_repository.get_game_by_id(
        session,
        game_id
    )


# Criar jogo
def create_game(
    session: Session,
    game: GameCreate
) -> Game:

    return game_repository.create_game(
        session,
        game
    )


# Atualizar jogo
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