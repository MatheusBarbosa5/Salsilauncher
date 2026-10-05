from fastapi import APIRouter, Query, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.models.entities import UserRating, Game
from app.schemas import RatingCreate
from app.security import DB, CurrentUser
from app.repository.library import owned

router = APIRouter(prefix="/ratings", tags=["Ratings"])

@router.get("/")
def list_ratings(session: DB, user: CurrentUser, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    return session.exec(select(UserRating).where(UserRating.user_id == user.id).order_by(UserRating.id).offset(offset).limit(limit)).all()

@router.put("/{game_id}")
def rate(game_id: int, data: RatingCreate, session: DB, user: CurrentUser):
    owned(session, Game, game_id, user.id)
    if game_id != data.game_id:
        raise HTTPException(422, "game_id do corpo e da URL devem coincidir")
    rating = session.exec(select(UserRating).where(UserRating.user_id == user.id, UserRating.game_id == game_id)).first()
    if rating is None:
        rating = UserRating(user_id=user.id, **data.model_dump())
    else:
        for key, value in data.model_dump().items():
            setattr(rating, key, value)
    session.add(rating)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "Avaliação alterada em outra requisição; tente novamente")
    session.refresh(rating)
    return rating

@router.delete("/{game_id}", status_code=204)
def delete_rating(game_id: int, session: DB, user: CurrentUser):
    owned(session, Game, game_id, user.id)
    rating = session.exec(select(UserRating).where(UserRating.user_id == user.id, UserRating.game_id == game_id)).first()
    if rating:
        session.delete(rating)
        session.commit()
    return Response(status_code=204)
