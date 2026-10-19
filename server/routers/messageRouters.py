from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import or_, and_
from sqlmodel import select
from core.security import DB, CurrentUser
from models.socialModels import Message
from models.UsersModels import get_utc_now
from schemas.socialSchemas import MessageCreate, MessageUpdate
from repositories.socialRepository import commit, active_user, friendship_pair

router = APIRouter(prefix='/messages', tags=['Messages'])
DELETED_MESSAGE = 'Mensagem excluída'

def participant(session, message_id, user_id):
    item = session.get(Message, message_id)
    if not item or user_id not in (item.sender_id, item.receiver_id):
        raise HTTPException(404, 'Mensagem não encontrada')
    return item

def require_friend(session, a, b):
    active_user(session, b)
    friendship = friendship_pair(session, a, b)
    if not friendship or friendship.status != 'accepted':
        raise HTTPException(403, 'Mensagens permitidas somente entre amigos sem bloqueio')

@router.get('/')
def list_messages(session: DB, user: CurrentUser, with_user_id: int | None = None, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    stmt = select(Message).where(or_(Message.sender_id == user.id, Message.receiver_id == user.id))
    if with_user_id is not None:
        stmt = stmt.where(or_(and_(Message.sender_id == user.id, Message.receiver_id == with_user_id), and_(Message.receiver_id == user.id, Message.sender_id == with_user_id)))
    return session.exec(stmt.order_by(Message.id.desc()).offset(offset).limit(limit)).all()

@router.post('/', status_code=201)
def send(data: MessageCreate, session: DB, user: CurrentUser):
    require_friend(session, user.id, data.receiver_id)
    return commit(session, Message(sender_id=user.id, **data.model_dump()))

@router.get('/{message_id}')
def get_message(message_id: int, session: DB, user: CurrentUser):
    return participant(session, message_id, user.id)

@router.patch('/{message_id}/read')
def mark_read(message_id: int, session: DB, user: CurrentUser):
    item = participant(session, message_id, user.id)
    if item.receiver_id != user.id:
        raise HTTPException(403, 'Somente o destinatário pode marcar como lida')
    if item.read_at is None:
        item.read_at = get_utc_now()
        return commit(session, item)
    return item

@router.patch('/{message_id}')
def edit(message_id: int, data: MessageUpdate, session: DB, user: CurrentUser):
    item = participant(session, message_id, user.id)
    if item.sender_id != user.id:
        raise HTTPException(403, 'Somente o remetente pode editar')
    if item.content == DELETED_MESSAGE:
        raise HTTPException(409, 'Mensagem excluída não pode ser editada')
    require_friend(session, user.id, item.receiver_id)
    if item.read_at is not None:
        raise HTTPException(409, 'Mensagem já foi lida')
    item.content = data.content
    return commit(session, item)

@router.delete('/{message_id}', status_code=204)
def delete_message(message_id: int, session: DB, user: CurrentUser):
    item = participant(session, message_id, user.id)
    if item.sender_id != user.id:
        raise HTTPException(403, 'Somente o remetente pode excluir')
    item.content = DELETED_MESSAGE
    commit(session, item)
    return Response(status_code=204)
