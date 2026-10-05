from fastapi import APIRouter, Query
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.models.entities import Tag
from app.security import DB, CurrentUser

router = APIRouter(prefix="/tags", tags=["Tags"])

@router.get("/")
def list_tags(session: DB, user: CurrentUser, limit: int = Query(100, ge=1, le=100), offset: int = Query(0, ge=0)):
    return [{"id": t.id, "name": t.name} for t in session.exec(select(Tag).where(Tag.owner_id == user.id).order_by(Tag.id).offset(offset).limit(limit)).all()]

@router.post("/", status_code=201)
def create_tag(session: DB, user: CurrentUser, name: str = Query(min_length=1, max_length=80)):
    name = name.strip().lower()
    if not name:
        from fastapi import HTTPException
        raise HTTPException(422, "Nome de tag vazio")
    tag = Tag(owner_id=user.id, name=name)
    session.add(tag)
    try:
        session.commit()
        session.refresh(tag)
    except IntegrityError:
        session.rollback()
        tag = session.exec(select(Tag).where(Tag.owner_id == user.id, Tag.name == name)).one()
    return {"id": tag.id, "name": tag.name}
