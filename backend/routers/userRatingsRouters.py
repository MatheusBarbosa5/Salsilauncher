from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)

from sqlmodel import Session

from models.userRatings import (
    UserRating,
    UserRatingCreate,
    UserRatingUpdate
)

from services import userRatingsService

from database import get_session


router = APIRouter(
    prefix="/user-ratings",
    tags=["User Ratings"]
)


# Criar avaliação
@router.post("/", response_model=UserRating, status_code=201)
def create_user_rating(
    rating_data: UserRatingCreate,
    user_id: int,
    session: Session = Depends(get_session)
):
    try:
        return userRatingsService.create_user_rating(
            session=session,
            user_id=user_id,
            rating_data=rating_data
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# Buscar avaliação pelo ID
@router.get("/{rating_id}", response_model=UserRating)
def get_user_rating(
    rating_id: int,
    session: Session = Depends(get_session)
):
    rating = userRatingsService.get_user_rating(
        session=session,
        rating_id=rating_id
    )

    if not rating:
        raise HTTPException(
            status_code=404,
            detail="User rating not found"
        )

    return rating


# Buscar avaliação de um usuário para um jogo
@router.get(
    "/user/{user_id}/game/{game_id}",
    response_model=UserRating
)
def get_user_rating_by_game(
    user_id: int,
    game_id: int,
    session: Session = Depends(get_session)
):
    rating = userRatingsService.get_user_rating_by_game(
        session=session,
        user_id=user_id,
        game_id=game_id
    )

    if not rating:
        raise HTTPException(
            status_code=404,
            detail="User rating not found"
        )

    return rating


# Buscar todas as avaliações de um usuário
@router.get(
    "/user/{user_id}",
    response_model=list[UserRating]
)
def get_user_ratings(
    user_id: int,
    session: Session = Depends(get_session)
):
    return userRatingsService.get_user_ratings(
        session=session,
        user_id=user_id
    )


# Buscar todas as avaliações de um jogo
@router.get(
    "/game/{game_id}",
    response_model=list[UserRating]
)
def get_game_ratings(
    game_id: int,
    session: Session = Depends(get_session)
):
    return userRatingsService.get_game_ratings(
        session=session,
        game_id=game_id
    )


# Atualizar avaliação
@router.put(
    "/{rating_id}",
    response_model=UserRating
)
def update_user_rating(
    rating_id: int,
    rating_update: UserRatingUpdate,
    session: Session = Depends(get_session)
):
    updated_rating = userRatingsService.update_user_rating(
        session=session,
        rating_id=rating_id,
        rating_update=rating_update
    )

    if not updated_rating:
        raise HTTPException(
            status_code=404,
            detail="User rating not found"
        )

    return updated_rating


# Deletar avaliação
@router.delete("/{rating_id}")
def delete_user_rating(
    rating_id: int,
    session: Session = Depends(get_session)
):
    success = userRatingsService.delete_user_rating(
        session=session,
        rating_id=rating_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="User rating not found"
        )

    return {
        "message": "User rating deleted successfully"
    }