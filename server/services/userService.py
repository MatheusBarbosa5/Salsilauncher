from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from models.UsersModels import User, get_utc_now
from core.security import hash_password, verify_password, DUMMY_HASH, unauthorized

def commit_user(session, user):
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "Email ou nome de usuário já cadastrado")
    session.refresh(user)
    return user

def create_user_service(session, data):
    fields = data.model_dump(exclude={"password"})
    fields['email'] = str(data.email).lower()
    fields['username'] = data.username.lower()
    return commit_user(session, User(**fields, password_hash=hash_password(data.password)))

def get_user_by_id_service(session, user_id):
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Usuário não encontrado")
    return user

def get_users_service(session, offset=0, limit=25):
    return session.exec(select(User).where(User.is_active == True, User.is_banned == False).order_by(User.id).offset(offset).limit(limit)).all()

def update_user_service(session, user_id, data):
    user = get_user_by_id_service(session, user_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == 'password':
            user.password_hash = hash_password(value)
        else:
            if key in ('email', 'username'):
                value = str(value).lower()
            setattr(user, key, value)
    user.updated_at = get_utc_now()
    return commit_user(session, user)

def autenticate_user(session, email, password):
    user = session.exec(select(User).where(User.email == str(email).lower())).first()
    valid = verify_password(password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid or not user.is_active or user.is_banned:
        raise unauthorized()
    user.last_login_at = user.last_activity_at = get_utc_now()
    return commit_user(session, user)

def delete_user_service(session, user_id):
    # Desativação preserva o histórico e impede login e uso dos tokens existentes.
    user = get_user_by_id_service(session, user_id)
    user.is_active = False
    user.updated_at = get_utc_now()
    commit_user(session, user)
