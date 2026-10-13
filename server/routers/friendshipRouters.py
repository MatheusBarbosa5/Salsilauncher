from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import or_
from sqlmodel import select
from core.security import DB, CurrentUser
from models.socialModels import Friendship
from schemas.socialSchemas import FriendshipCreate, FriendshipUpdate
from repositories.socialRepository import commit, active_user, pair_key, friendship_pair

router = APIRouter(prefix='/friendships', tags=['Friendships'])

def participant(session, item_id, user_id):
    item = session.get(Friendship, item_id)
    if not item or user_id not in (item.user_id, item.friend_id):
        raise HTTPException(404, 'Amizade não encontrada')
    return item

def public(item):
    return item.model_dump(exclude={'pair_key'})

@router.get('/')
def list_friendships(session: DB, user: CurrentUser, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(Friendship).where(or_(Friendship.user_id == user.id, Friendship.friend_id == user.id)).order_by(Friendship.id).offset(offset).limit(limit)
    return [public(item) for item in session.exec(stmt).all()]

@router.post('/', status_code=201)
def request_friendship(data: FriendshipCreate, session: DB, user: CurrentUser):
    if data.friend_id == user.id:
        raise HTTPException(422, 'Não é possível adicionar a si mesmo')
    active_user(session, data.friend_id)
    if friendship_pair(session, user.id, data.friend_id):
        raise HTTPException(409, 'Já existe um pedido, amizade ou bloqueio entre estas contas')
    item = Friendship(user_id=user.id, friend_id=data.friend_id, pair_key=pair_key(user.id, data.friend_id))
    return public(commit(session, item))

@router.get('/{friendship_id}')
def get_friendship(friendship_id: int, session: DB, user: CurrentUser):
    return public(participant(session, friendship_id, user.id))

@router.patch('/{friendship_id}')
def respond(friendship_id: int, data: FriendshipUpdate, session: DB, user: CurrentUser):
    item = participant(session, friendship_id, user.id)
    old_status = item.status
    if data.status == 'blocked':
        if old_status == 'blocked':
            if item.blocked_by_id != user.id:
                raise HTTPException(403, 'Bloqueio definido pela outra conta')
            return public(item)
        item.blocked_by_id = user.id
    else:
        if item.friend_id != user.id:
            raise HTTPException(403, 'Somente o destinatário pode aceitar ou rejeitar')
        if old_status != 'pending':
            raise HTTPException(409, 'O pedido não está pendente')
    # Compare-and-set evita uma resposta sobrescrever bloqueio/aceite concorrente.
    from sqlalchemy import update
    result = session.exec(update(Friendship).where(Friendship.id == item.id, Friendship.status == old_status).values(status=data.status, blocked_by_id=item.blocked_by_id).execution_options(synchronize_session=False))
    if result.rowcount != 1:
        session.rollback()
        raise HTTPException(409, 'Amizade alterada em outra requisição')
    session.commit()
    session.refresh(item)
    return public(item)

@router.delete('/{friendship_id}', status_code=204)
def remove(friendship_id: int, session: DB, user: CurrentUser):
    item = participant(session, friendship_id, user.id)
    if item.status == 'blocked' and item.blocked_by_id != user.id:
        raise HTTPException(403, 'Somente quem bloqueou pode remover o bloqueio')
    session.delete(item)
    session.commit()
    return Response(status_code=204)
