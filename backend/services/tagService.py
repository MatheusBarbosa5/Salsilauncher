from typing import List
from sqlmodel import Session

from models.tags import Tag
from repositories import tagRepository

# Funções
def _generate_slug(text: str) -> str:
    return text.strip().lower().replace(" ", "-")


# Serviços
def post_tags(session: Session, name: str) -> Tag:
    clean_name = name.strip().lower()

    existing_tag = tagRepository.get_tag_by_name(session, clean_name)
    if existing_tag:
        return existing_tag

    tag = Tag(
        name=clean_name,
        slug=_generate_slug(clean_name)
    )

    return tagRepository.create_tag(session, tag)


def get_tags(session: Session) -> List[Tag]:
    return tagRepository.get_tags(session)