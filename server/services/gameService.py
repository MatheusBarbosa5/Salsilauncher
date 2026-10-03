from sqlmodel import Session

from models.gameModels import Game, GameCreate, GameUpdate
from repositories import gameRepository


def get_games(session: Session, q: str | None = None, limit: int = 25, offset: int = 0) -> list[Game]:
    return gameRepository.get_games(session=session, q=q, limit=limit, offset=offset)


def get_game_by_id(session: Session, game_id: int) -> Game | None:
    return gameRepository.get_game_by_id(session, game_id)


def create_game(session: Session, game: GameCreate) -> Game:
    return gameRepository.create_game(session, game)


def update_game(session: Session, game_id: int, game_update: GameUpdate) -> Game | None:
    return gameRepository.update_game(session, game_id, game_update)


def delete_game(session: Session, game_id: int) -> bool:
    return gameRepository.delete_game(session, game_id)
