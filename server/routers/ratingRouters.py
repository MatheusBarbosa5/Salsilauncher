from fastapi import APIRouter, Query, Response, HTTPException
from sqlalchemy import func, or_
from sqlmodel import select
from core.security import DB, CurrentUser
from models.gameModels import Game
from models.socialModels import Friendship, PlaySession, Rating
from models.UsersModels import User, get_utc_now
from schemas.socialSchemas import RatingCreate, RatingUpdate
from repositories.socialRepository import owned, active_game, commit

router = APIRouter(prefix='/ratings', tags=['Ratings'])

@router.get('/')
def list_ratings(session: DB, user: CurrentUser, game_id: int | None = None, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(Rating).where(Rating.user_id == user.id)
    if game_id is not None:
        stmt = stmt.where(Rating.game_id == game_id)
    return session.exec(stmt.order_by(Rating.id).offset(offset).limit(limit)).all()

@router.get('/friends')
def list_friends_game_activity(session: DB, user: CurrentUser, game_id: int = Query(..., gt=0)):
    target_game = active_game(session, game_id)

    # Match the canonical game_id as well as any active entry with the same Steam AppID or title
    match_conditions = [Game.id == target_game.id]
    if target_game.steam_appid is not None:
        match_conditions.append(Game.steam_appid == target_game.steam_appid)
    if target_game.title and target_game.title.strip():
        match_conditions.append(func.lower(Game.title) == target_game.title.strip().lower())

    matching_game_ids = list(
        session.exec(
            select(Game.id).where(Game.is_active == True, or_(*match_conditions))
        ).all()
    ) or [target_game.id]

    friendships = session.exec(
        select(Friendship).where(
            Friendship.status == 'accepted',
            or_(Friendship.user_id == user.id, Friendship.friend_id == user.id),
        )
    ).all()
    friend_ids = [
        f.friend_id if f.user_id == user.id else f.user_id
        for f in friendships
    ]
    if not friend_ids:
        return []

    friends = session.exec(
        select(User).where(
            User.id.in_(friend_ids),
            User.is_active == True,
            User.is_banned == False,
        ).order_by(User.username)
    ).all()

    results = []
    for friend in friends:
        rating = session.exec(
            select(Rating)
            .where(Rating.user_id == friend.id, Rating.game_id.in_(matching_game_ids))
            .order_by(Rating.updated_at.desc())
        ).first()

        sessions = session.exec(
            select(PlaySession).where(
                PlaySession.user_id == friend.id,
                PlaySession.game_id.in_(matching_game_ids),
            )
        ).all()
        playtime_seconds = sum((s.duration_seconds or 0) for s in sessions)
        sessions_count = len(sessions)

        if rating is not None or sessions_count > 0 or playtime_seconds > 0:
            results.append({
                'user_id': friend.id,
                'username': friend.username,
                'display_name': friend.display_name,
                'avatar_url': friend.avatar_url,
                'score': rating.score if rating else None,
                'review': rating.review if rating else None,
                'rated_at': rating.updated_at.isoformat() if rating else None,
                'playtime_seconds': playtime_seconds,
                'sessions_count': sessions_count,
            })

    return results

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
