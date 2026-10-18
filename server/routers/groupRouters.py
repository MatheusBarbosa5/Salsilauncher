from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import func
from sqlmodel import select
from core.security import DB, CurrentUser
from models.socialModels import Group, GroupMember, GroupMessage
from schemas.socialSchemas import GroupCreate, GroupUpdate, GroupMemberAdd, GroupMessageCreate
from repositories.socialRepository import commit, active_user, friendship_pair

router = APIRouter(prefix='/groups', tags=['Groups'])
MAX_MEMBERS = 50

def member_ids(session, group_id):
    return list(session.exec(select(GroupMember.user_id).where(GroupMember.group_id == group_id)).all())

def serialize(session, group):
    return {**group.model_dump(), 'member_ids': member_ids(session, group.id)}

def member_group(session, group_id, user_id):
    group = session.get(Group, group_id)
    if group is None or session.get(GroupMember, (group_id, user_id)) is None:
        raise HTTPException(404, 'Grupo não encontrado')
    return group

def owner_group(session, group_id, user_id):
    group = member_group(session, group_id, user_id)
    if group.owner_id != user_id:
        raise HTTPException(403, 'Somente o criador do grupo pode fazer isso')
    return group

def require_friend(session, owner_id, other_id):
    active_user(session, other_id)
    friendship = friendship_pair(session, owner_id, other_id)
    if not friendship or friendship.status != 'accepted':
        raise HTTPException(403, 'Só é possível adicionar amigos ao grupo')

@router.get('/')
def list_groups(session: DB, user: CurrentUser):
    groups = session.exec(
        select(Group).join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == user.id).order_by(Group.id.desc())
    ).all()
    return [serialize(session, g) for g in groups]

@router.post('/', status_code=201)
def create_group(data: GroupCreate, session: DB, user: CurrentUser):
    ids = set(data.member_ids) - {user.id}
    for other_id in ids:
        require_friend(session, user.id, other_id)
    group = Group(name=data.name.strip(), owner_id=user.id)
    session.add(group)
    session.flush()
    for uid in {user.id, *ids}:
        session.add(GroupMember(group_id=group.id, user_id=uid))
    session.commit()
    session.refresh(group)
    return serialize(session, group)

@router.get('/{group_id}')
def get_group(group_id: int, session: DB, user: CurrentUser):
    return serialize(session, member_group(session, group_id, user.id))

@router.patch('/{group_id}')
def rename_group(group_id: int, data: GroupUpdate, session: DB, user: CurrentUser):
    group = owner_group(session, group_id, user.id)
    group.name = data.name.strip()
    commit(session, group)
    return serialize(session, group)

@router.delete('/{group_id}', status_code=204)
def delete_group(group_id: int, session: DB, user: CurrentUser):
    group = owner_group(session, group_id, user.id)
    for model in (GroupMessage, GroupMember):
        for row in session.exec(select(model).where(model.group_id == group.id)).all():
            session.delete(row)
    session.flush()
    session.delete(group)
    session.commit()
    return Response(status_code=204)

@router.post('/{group_id}/members', status_code=201)
def add_member(group_id: int, data: GroupMemberAdd, session: DB, user: CurrentUser):
    group = owner_group(session, group_id, user.id)
    if session.get(GroupMember, (group.id, data.user_id)):
        raise HTTPException(409, 'Usuário já está no grupo')
    count = session.exec(select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group.id)).one()
    if count >= MAX_MEMBERS:
        raise HTTPException(409, f'Limite de {MAX_MEMBERS} membros atingido')
    require_friend(session, user.id, data.user_id)
    commit(session, GroupMember(group_id=group.id, user_id=data.user_id))
    return serialize(session, group)

@router.delete('/{group_id}/members/{user_id}', status_code=204)
def remove_member(group_id: int, user_id: int, session: DB, user: CurrentUser):
    group = member_group(session, group_id, user.id)
    if user_id != user.id and group.owner_id != user.id:
        raise HTTPException(403, 'Somente o criador pode remover outros membros')
    if user_id == group.owner_id:
        raise HTTPException(409, 'O criador não pode sair; exclua o grupo')
    row = session.get(GroupMember, (group.id, user_id))
    if row is None:
        raise HTTPException(404, 'Membro não encontrado')
    session.delete(row)
    session.commit()
    return Response(status_code=204)

@router.get('/{group_id}/messages')
def list_group_messages(group_id: int, session: DB, user: CurrentUser, limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    member_group(session, group_id, user.id)
    stmt = select(GroupMessage).where(GroupMessage.group_id == group_id)
    return session.exec(stmt.order_by(GroupMessage.id.desc()).offset(offset).limit(limit)).all()

@router.post('/{group_id}/messages', status_code=201)
def send_group_message(group_id: int, data: GroupMessageCreate, session: DB, user: CurrentUser):
    member_group(session, group_id, user.id)
    return commit(session, GroupMessage(group_id=group_id, sender_id=user.id, content=data.content))

@router.delete('/{group_id}/messages/{message_id}', status_code=204)
def delete_group_message(group_id: int, message_id: int, session: DB, user: CurrentUser):
    group = member_group(session, group_id, user.id)
    item = session.get(GroupMessage, message_id)
    if item is None or item.group_id != group.id:
        raise HTTPException(404, 'Mensagem não encontrada')
    if item.sender_id != user.id and group.owner_id != user.id:
        raise HTTPException(403, 'Somente o remetente ou o criador pode excluir')
    session.delete(item)
    session.commit()
    return Response(status_code=204)
