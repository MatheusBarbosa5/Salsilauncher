from typing import Optional, List

from sqlmodel import Session

from models.users import User, UserCreate, UserUpdate
from repositories import usersRepository

# Obter usuários
def get_users(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0
) -> List[User]:

    return usersRepository.get_users(
        session=session,
        q=q,
        limit=limit,
        offset=offset
    )


# Obter usuário por ID
def get_user(
    session: Session,
    user_id: int
) -> User | None:

    return usersRepository.get_user(
        session=session,
        user_id=user_id
    )


# Criar usuário
def create_user(
    session: Session,
    user: UserCreate
) -> User:

    return usersRepository.create_user(
        session=session,
        user_data=user
    )


# Atualizar usuário
def update_user(
    session: Session,
    user_id: int,
    user_update: UserUpdate
) -> User | None:

    return usersRepository.update_user(
        session=session,
        user_id=user_id,
        user_data=user_update
    )


# Deletar usuário
def delete_user(
    session: Session,
    user_id: int
) -> bool:

    return usersRepository.delete_user(
        session=session,
        user_id=user_id
    )