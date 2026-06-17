from sqlmodel import Session, select
from models.tags import Tag


def get_tag_by_name(session: Session, name: str) -> Tag | None:
    statement = select(Tag).where(Tag.name == name)
    return session.exec(statement).first()


def get_tags(session: Session) -> list[Tag]:
    statement = select(Tag)
    return list(session.exec(statement).all())


def create_tag(session: Session, tag: Tag) -> Tag:
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag

def delete_tag(session: Session, tag_id: int) -> bool:
    tag_db = session.get(Tag, tag_id)

    if not tag_db:
        return False

    session.delete(tag_db)
    session.commit()
    return True