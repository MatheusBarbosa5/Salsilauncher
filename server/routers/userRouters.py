from fastapi import APIRouter, Query, HTTPException, Response
from core.security import DB, CurrentUser
from schemas.userSchemas import UserCreate, UserRead, UserUpdate, UserPublic
from services import userService

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserRead, status_code=201)
def create_user(data: UserCreate, session: DB):
    return userService.create_user_service(session, data)

@router.get("/me", response_model=UserRead)
def me(user: CurrentUser):
    return user

@router.get("/", response_model=list[UserPublic])
def get_users(session: DB, user: CurrentUser, offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100)):
    return userService.get_users_service(session, offset, limit)

@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: int, session: DB, current: CurrentUser):
    user = userService.get_user_by_id_service(session, user_id)
    if not user.is_active or user.is_banned:
        raise HTTPException(404, "Usuário não encontrado")
    return user

@router.put("/{user_id}", response_model=UserRead)
@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, data: UserUpdate, session: DB, user: CurrentUser):
    if user_id != user.id:
        raise HTTPException(403, "Você só pode editar sua própria conta")
    return userService.update_user_service(session, user_id, data)

@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, session: DB, user: CurrentUser):
    if user_id != user.id:
        raise HTTPException(403, "Você só pode desativar sua própria conta")
    userService.delete_user_service(session, user_id)
    return Response(status_code=204)
