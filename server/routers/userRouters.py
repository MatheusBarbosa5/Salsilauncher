from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from database import get_session
from models.UsersModels import User
from schemas.userSchemas import (
    UserCreate,
    UserRead,
    UserUpdate,
)
from services.userService import (
    create_user_service,
    delete_user_service,
    get_user_by_id_service,
    get_users_service,
    update_user_service,
)

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# Criar um novo usuário
@router.post(
    "/", 
    response_model=UserRead, 
    status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate, 
    session: Session = Depends(get_session)
):
    
    return create_user_service(
        session, 
        data
    )

# Obter todos os usuários
@router.get(
    "/",
    response_model=list[UserRead],
)
def get_users(
    offset: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    return get_users_service(
        session,
        offset,
        limit,
    )

# Obter um usuário específico pelo ID
@router.get(
    "/{user_id}",
    response_model=UserRead,
)
def get_user(
    user_id: int,
    session: Session = Depends(get_session),
):
    return get_user_by_id_service(
        session,
        user_id,
    )

# atualizar um usuário existente
@router.put(
    "/{user_id}",
    response_model=UserRead,
)
def update_user(
    user_id: int,
    data: UserUpdate,
    session: Session = Depends(get_session),
):
    return update_user_service(
        session,
        user_id,
        data,
    )

# Deletar um usuário existente
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
):
    delete_user_service(
        session,
        user_id,
    )

