from datetime import datetime

from fastapi import HTTPException, status
from sqlmodel import Session

from core.security import hash_password, verify_password
from models.user import User
from repositories.user import (
    create_user,
    delete_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    list_users,
    update_user,
)
from schemas.user import UserCreate, UserUpdate


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

    # Criar user...
