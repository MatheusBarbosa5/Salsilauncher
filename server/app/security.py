from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash
from sqlmodel import Session
from app.database import get_session
from app.models.entities import User

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)
DUMMY_HASH = password_hash.hash("dummy-password-for-timing")

def unauthorized():
    return HTTPException(401, "Credenciais inválidas ou token expirado", headers={"WWW-Authenticate": "Bearer"})

def create_token(user_id: int, settings):
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=settings.token_minutes), "iss": "salsilauncher", "aud": "salsilauncher-launcher"}, settings.secret_key, algorithm="HS256")

def get_current_user(request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)], session: Annotated[Session, Depends(get_session)]) -> User:
    if credentials is None:
        raise unauthorized()
    try:
        claims = jwt.decode(credentials.credentials, request.app.state.settings.secret_key, algorithms=["HS256"], audience="salsilauncher-launcher", issuer="salsilauncher", options={"require": ["sub", "exp", "iat"]})
        if not isinstance(claims["sub"], str) or not claims["sub"].isdigit():
            raise unauthorized()
        user_id = int(claims["sub"])
        if not 0 < user_id <= 9223372036854775807:
            raise unauthorized()
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized()
    user = session.get(User, user_id)
    if user is None or not user.is_active or user.is_banned:
        raise unauthorized()
    return user

DB = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]
