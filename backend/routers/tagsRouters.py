from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import get_session
from services import tagService

from models.tags import Tag


router = APIRouter(prefix="/tags", tags=["tags"])
# Obter Tag
@router.get("/")
def get_tags(session: Session = Depends(get_session)):
    return tagService.get_tags(session)

# Criar Tag
@router.post("/")
def post_tags(name: str, session: Session = Depends(get_session)):
    return tagService.post_tags(session, name)


# Excluir Tag
@router.delete("/{tag_id}")
def delete_tag(tag_id: int, session: Session = Depends(get_session)):
    sucesso = tagService.delete_tag(session, tag_id)

    if not sucesso:
        raise HTTPException(status_code=404, detail="tag não encontrada")

    return 


# Editar Tag