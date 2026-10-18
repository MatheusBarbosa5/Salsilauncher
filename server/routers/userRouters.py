import uuid
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException, Response, Request, UploadFile, File
from core.security import DB, CurrentUser
from schemas.userSchemas import UserCreate, UserRead, UserUpdate, UserPublic
from services import userService

router = APIRouter(prefix="/users", tags=["Users"])

AVATAR_DIR = Path(__file__).resolve().parent.parent / "uploads" / "avatars"
MAX_AVATAR_BYTES = 2 * 1024 * 1024

def _image_extension(data: bytes) -> str | None:
    # Tipo detectado pelo conteúdo; SVG fica de fora por poder conter scripts.
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None

@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(request: Request, session: DB, user: CurrentUser, file: UploadFile = File(...)):
    data = await file.read(MAX_AVATAR_BYTES + 1)
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(413, "A imagem deve ter no máximo 2 MB")
    extension = _image_extension(data)
    if extension is None:
        raise HTTPException(415, "Use uma imagem PNG, JPG, GIF ou WEBP")
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{extension}"
    (AVATAR_DIR / name).write_bytes(data)
    url = f"{str(request.base_url).rstrip('/')}/uploads/avatars/{name}"
    return userService.update_user_service(session, user.id, UserUpdate(avatar_url=url))

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
