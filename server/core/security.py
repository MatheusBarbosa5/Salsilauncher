import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
from sqlmodel import Session
from database import get_session
from models.UsersModels import User

password_hasher = PasswordHash((Argon2Hasher(), BcryptHasher()))
DUMMY_HASH = password_hasher.hash("dummy-password-for-timing")
bearer = HTTPBearer(auto_error=False)
catalog_key = APIKeyHeader(name="X-Catalog-Key", auto_error=False)


def get_secret():
    key = os.getenv("SECRET_KEY", "")
    if len(key) < 32 or key.startswith("SUBSTITUA_"):
        raise RuntimeError("Configure SECRET_KEY no server/.env com uma chave aleatória de pelo menos 32 caracteres")
    return key

def hash_password(password):
    return password_hasher.hash(password)

def verify_password(plain_password, password_hash):
    try:
        return password_hasher.verify(plain_password, password_hash)
    except Exception:
        # Hash legado malformado não deve virar resposta 500 nem comparação em texto puro.
        return False

def unauthorized():
    return HTTPException(401, "Email/senha inválidos ou token expirado", headers={"WWW-Authenticate": "Bearer"})

def create_token(user):
    now = datetime.now(timezone.utc)
    minutes = int(os.getenv("ACCESS_TOKEN_MINUTES", "43200"))
    if not 1 <= minutes <= 525600:
        raise RuntimeError("ACCESS_TOKEN_MINUTES deve estar entre 1 e 525600")
    token = jwt.encode({"sub": str(user.id), "iat": now, "exp": now + timedelta(minutes=minutes), "iss": "salsilauncher", "aud": "launcher"}, get_secret(), algorithm="HS256")
    return token, minutes * 60

DB = Annotated[Session, Depends(get_session)]

def get_current_user(session: DB, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]):
    if credentials is None:
        raise unauthorized()
    try:
        claims = jwt.decode(credentials.credentials, get_secret(), algorithms=["HS256"], issuer="salsilauncher", audience="launcher", options={"require": ["sub", "iat", "exp"]})
        sub = claims["sub"]
        if not isinstance(sub, str) or not sub.isdigit() or not 0 < int(sub) <= 9223372036854775807:
            raise unauthorized()
        user_id = int(sub)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized()
    user = session.get(User, user_id)
    if user is None or not user.is_active or user.is_banned:
        raise unauthorized()
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

def require_catalog_editor(user: CurrentUser, key: Annotated[str | None, Depends(catalog_key)]):
    expected = os.getenv("CATALOG_WRITE_KEY", "")
    if not expected or not key or not secrets.compare_digest(key, expected):
        raise HTTPException(403, "Edição do catálogo restrita")
