from typing import List

from sqlmodel import Session, select

from models.userRatings import (
    UserRating,
    UserRatingCreate,
    UserRatingUpdate
)


# Buscar avaliação de um usuário para um jogo
def get_user_rating_by_game(
    session: Session,
    user_id: int,
    game_id: int
) -> UserRating | None:

    stmt = select(UserRating).where(
        UserRating.user_id == user_id,
        UserRating.game_id == game_id
    )

    return session.exec(stmt).first()


# Criar avaliação
def create_user_rating(
    session: Session,
    user_id: int,
    rating_data: UserRatingCreate
) -> UserRating:

    rating = UserRating(
        user_id=user_id,
        game_id=rating_data.game_id,
        stars=rating_data.stars,
        gameplay=rating_data.gameplay,
        graphics=rating_data.graphics,
        story=rating_data.story
    )

    session.add(rating)
    session.commit()
    session.refresh(rating)

    return rating


# Buscar avaliação pelo ID
def get_user_rating(
    session: Session,
    rating_id: int
) -> UserRating | None:

    return session.get(
        UserRating,
        rating_id
    )


# Buscar todas as avaliações de um usuário
def get_user_ratings(
    session: Session,
    user_id: int
) -> List[UserRating]:

    stmt = select(UserRating).where(
        UserRating.user_id == user_id
    )

    return session.exec(stmt).all()


# Buscar todas as avaliações de um jogo
def get_game_ratings(
    session: Session,
    game_id: int
) -> List[UserRating]:

    stmt = select(UserRating).where(
        UserRating.game_id == game_id
    )

    return session.exec(stmt).all()


# Atualizar avaliação
def update_user_rating(
    session: Session,
    rating_id: int,
    rating_update: UserRatingUpdate
) -> UserRating | None:

    rating_db = session.get(
        UserRating,
        rating_id
    )

    if rating_db is None:
        return None

    update_data = rating_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            rating_db,
            field,
            value
        )

    session.add(rating_db)
    session.commit()
    session.refresh(rating_db)

    return rating_db


# Deletar avaliação
def delete_user_rating(
    session: Session,
    rating_id: int
) -> bool:

    rating_db = session.get(
        UserRating,
        rating_id
    )

    if not rating_db:
        return False

    session.delete(rating_db)
    session.commit()

    return True