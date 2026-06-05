from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from services import tagService


router = APIRouter(prefix="/tags", tags=["tags"])
# Obter Tag
@router.get("/")
def get_tags(session: Session = Depends(get_session)):
    return tagService.get_tags(session)

# Criar Tag
@router.post("/")
def post_tags(name: str, session: Session = Depends(get_session)):
    return tagService.post_tags(session, name)