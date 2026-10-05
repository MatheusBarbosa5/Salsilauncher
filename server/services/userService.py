from datetime import datetime

from fastapi import HTTPException, status
from sqlmodel import Session

from core.security import hash_password, verify_password
from models.UsersModels import User
from repositories.userRepository import (
    create_user,
    delete_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    get_users,
    update_user,
)
from schemas.userSchemas import UserCreate, UserUpdate


# Criar usuário
def create_user_service(
        session: Session,
        data: UserCreate
) -> User:

    # verificar se user existe pelo email
    if get_user_by_email(session, data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ja vinculado",
        )

    user = User(
        username=data.username,
        email=data.email,
        password=hash_password(data.password),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    return create_user(session, user)

# Obter usuário pelo ID
def get_user_by_id_service(
        session: Session,
        user_id: int
) -> User:
    user = get_user_by_id(session, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario nao encontrado",
        )

    return user


# Obter todos os usuários
def get_users_service(
        session: Session,
        offset: int = 0,
        limit: int = 100
) -> list[User]:
    
    return get_users(session, offset=offset, limit=limit)

# Atualizar usuário
def update_user_service(
    session: Session,
    user_id: int,
    data: UserUpdate,
) -> User:

    user = get_user_by_id_service(
        session,
        user_id,
    )

    if data.username is not None:
        existing_user = get_user_by_username(
            session,
            data.username,
        )

        if existing_user and existing_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists",
            )

        user.username = data.username

    if data.email is not None:
        existing_user = get_user_by_email(
            session,
            data.email,
        )

        if existing_user and existing_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
            )

        user.email = data.email

    if data.display_name is not None:
        user.display_name = data.display_name

    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url

    if data.language is not None:
        user.language = data.language

    if data.theme is not None:
        user.theme = data.theme

    user.updated_at = datetime.utcnow()

    return update_user(session, user)


# autenticar usuário
def autenticate_user(
    session: Session,
    email: str,
    password: str
) -> User:
    user = get_user_by_email(session, email)

    # Usuário existente
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario nao encontrado",
        )

    # Velidar senha
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta",
        )

    # Validar usuário ativo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo",
        )

    # Validar banimento
    if not user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario banido",
        )
    
    user.last_login_at = datetime.utcnow()
    user.last_activity_at = datetime.utcnow()

    return update_user(session, user)

# Deletar usuário
def delete_user_service(
    session: Session,
    user_id: int
) -> None:
    user = get_user_by_id_service(session, user_id)

    delete_user(session, user)