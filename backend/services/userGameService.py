from typing import Optional, List

from sqlmodel import Session

from models.userGame import UserGame, UserGameCreate
from repositories import userGameRepository


# Obter jogos do usuário
def get_user_games(
    session: Session,
    user_id: int
) -> List[UserGame]:

    return userGameRepository.get_user_games(
        session=session,
        user_id=user_id
    )


# Obter relação usuário + jogo
def get_user_game(
    session: Session,
    user_id: int,
    game_id: int
) -> Optional[UserGame]:

    return userGameRepository.get_user_game(
        session=session,
        user_id=user_id,
        game_id=game_id
    )


# Adicionar jogo à biblioteca
def create_user_game(
    session: Session,
    user_id: int,
    user_game: UserGameCreate
) -> UserGame:

    return userGameRepository.create_user_game(
        session=session,
        user_id=user_id,
        user_game=user_game
    )


# Atualizar relação usuário + jogo
def update_user_game(
    session: Session,
    user_id: int,
    game_id: int,
    user_game_update: UserGame
) -> UserGame | None:

    return userGameRepository.update_user_game(
        session=session,
        user_id=user_id,
        game_id=game_id,
        user_game_data=user_game_update
    )


# Remover jogo da biblioteca
def delete_user_game(
    session: Session,
    user_id: int,
    game_id: int
) -> bool:

    return userGameRepository.delete_user_game(
        session=session,
        user_id=user_id,
        game_id=game_id
    )