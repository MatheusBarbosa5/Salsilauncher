from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.models.entities import User
from app.schemas import UserCreate, UserPublic, LoginData, TokenResponse
from app.security import DB, CurrentUser, password_hash, DUMMY_HASH, create_token, unauthorized

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserPublic, status_code=201)
def register(data: UserCreate, session: DB):
    user = User(username=data.username.lower(), email=str(data.email).lower(), display_name=data.display_name, password_hash=password_hash.hash(data.password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "Email ou nome de usuário já cadastrado")
    session.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(data: LoginData, request: Request, session: DB):
    user = session.exec(select(User).where(User.email == str(data.email).lower())).first()
    valid = password_hash.verify(data.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid or not user.is_active or user.is_banned:
        raise unauthorized()
    settings = request.app.state.settings
    return TokenResponse(access_token=create_token(user.id, settings), expires_in=settings.token_minutes * 60)

@router.get("/me", response_model=UserPublic)
def me(user: CurrentUser):
    return user
