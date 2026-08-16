from typing import List

from sqlmodel import Session

from models.userRatings import (
    UserRating,
    UserRatingCreate,
    UserRatingUpdate
)

from repositories import userRatingsRepository as userRatingRepository


# Criar avaliação
def create_user_rating(
    session: Session,
    user_id: int,
    rating_data: UserRatingCreate
) -> UserRating:

    existing = userRatingRepository.get_user_rating_by_game(
        session=session,
        user_id=user_id,
        game_id=rating_data.game_id
    )

    if existing:
        raise ValueError(
            "O usuário já avaliou este jogo"
        )

    return userRatingRepository.create_user_rating(
        session=session,
        user_id=user_id,
        rating_data=rating_data
    )


# Buscar avaliação pelo ID
def get_user_rating(
    session: Session,
    rating_id: int
) -> UserRating | None:

    return userRatingRepository.get_user_rating(
        session=session,
        rating_id=rating_id
    )


# Buscar avaliação de um usuário para um jogo
def get_user_rating_by_game(
    session: Session,
    user_id: int,
    game_id: int
) -> UserRating | None:

    return userRatingRepository.get_user_rating_by_game(
        session=session,
        user_id=user_id,
        game_id=game_id
    )


# Buscar todas as avaliações de um usuário
def get_user_ratings(
    session: Session,
    user_id: int
) -> List[UserRating]:

    return userRatingRepository.get_user_ratings(
        session=session,
        user_id=user_id
    )


# Buscar todas as avaliações de um jogo
def get_game_ratings(
    session: Session,
    game_id: int
) -> List[UserRating]:

    return userRatingRepository.get_game_ratings(
        session=session,
        game_id=game_id
    )


# Atualizar avaliação
def update_user_rating(
    session: Session,
    rating_id: int,
    rating_update: UserRatingUpdate
) -> UserRating | None:

    return userRatingRepository.update_user_rating(
        session=session,
        rating_id=rating_id,
        rating_update=rating_update
    )


# Deletar avaliação
def delete_user_rating(
    session: Session,
    rating_id: int
) -> bool:

    return userRatingRepository.delete_user_rating(
        session=session,
        rating_id=rating_id
    )