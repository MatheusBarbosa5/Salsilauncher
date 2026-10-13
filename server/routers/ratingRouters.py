from fastapi import APIRouter, Query, Response, HTTPException
from sqlmodel import select
from core.security import DB, CurrentUser
from models.socialModels import Rating
from models.UsersModels import get_utc_now
from schemas.socialSchemas import RatingCreate, RatingUpdate
from repositories.socialRepository import owned, active_game, commit

router = APIRouter(prefix='/ratings', tags=['Ratings'])

@router.get('/')
def list_ratings(session: DB, user: CurrentUser, game_id: int | None = None, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(Rating).where(Rating.user_id == user.id)
    if game_id is not None:
        stmt = stmt.where(Rating.game_id == game_id)
    return session.exec(stmt.order_by(Rating.id).offset(offset).limit(limit)).all()

@router.post('/', status_code=201)
def rate(data: RatingCreate, session: DB, user: CurrentUser):
    active_game(session, data.game_id)
    return commit(session, Rating(user_id=user.id, **data.model_dump()))

@router.get('/{rating_id}')
def get_rating(rating_id: int, session: DB, user: CurrentUser):
    return owned(session, Rating, rating_id, user.id)

@router.patch('/{rating_id}')
@router.put('/{rating_id}')
def update_rating(rating_id: int, data: RatingUpdate, session: DB, user: CurrentUser):
    item = owned(session, Rating, rating_id, user.id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.updated_at = get_utc_now()
    return commit(session, item)

@router.delete('/{rating_id}', status_code=204)
def delete_rating(rating_id: int, session: DB, user: CurrentUser):
    item = owned(session, Rating, rating_id, user.id)
    session.delete(item)
    session.commit()
    return Response(status_code=204)
