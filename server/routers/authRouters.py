from fastapi import APIRouter
from core.security import DB, CurrentUser, create_token
from schemas.userSchemas import UserCreate, UserRead, LoginData, TokenResponse
from services.userService import create_user_service, autenticate_user

router = APIRouter(prefix="/auth", tags=["Auth"])
@router.post("/register", response_model=UserRead, status_code=201)
def register(data: UserCreate, session: DB):
    return create_user_service(session, data)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginData, session: DB):
    user = autenticate_user(session, data.email, data.password)
    token, seconds = create_token(user)
    return TokenResponse(access_token=token, expires_in=seconds)

@router.get("/me", response_model=UserRead)
def me(user: CurrentUser):
    return user

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(user: CurrentUser):
    token, seconds = create_token(user)
    return TokenResponse(access_token=token, expires_in=seconds)
