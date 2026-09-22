from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Depends
)

from sqlmodel import Session
from models.users import User, UserCreate, UserUpdate
from services import usersService
from database import get_session


router = APIRouter(prefix="/users", tags=["Users"])


# Obter usuários
@router.get("/", response_model=list[User])
def get_users(
    q: str | None = Query(None, description="Search by username, email or display name"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    return usersService.get_users(
        session=session,
        q=q,
        limit=limit,
        offset=offset
    )


# Obter usuário por ID
@router.get("/{user_id}", response_model=User)
def get_user(
    user_id: int,
    session: Session = Depends(get_session)
):
    user = usersService.get_user(
        session=session,
        user_id=user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# Criar usuário
@router.post("/", response_model=User, status_code=201)
def create_user(
    user: UserCreate,
    session: Session = Depends(get_session)
):
    return usersService.create_user(
        session=session,
        user=user
    )


# Atualizar usuário
@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session)
):
    updated_user = usersService.update_user(
        session=session,
        user_id=user_id,
        user_update=user_update
    )

    if not updated_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated_user


# Deletar usuário
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    session: Session = Depends(get_session)
):
    success = usersService.delete_user(
        session=session,
        user_id=user_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {"message": "User deleted successfully"}

# Codificação de senha
# Apenas campos obrigaórios 