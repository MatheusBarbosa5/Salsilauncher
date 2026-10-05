from fastapi import HTTPException
from sqlmodel import select
from app.models.entities import Game, Tag, Collection, GameTagLink

def owned(session, model, item_id, user_id):
    item = session.exec(select(model).where(model.id == item_id, model.owner_id == user_id)).first()
    if item is None:
        raise HTTPException(404, "Registro não encontrado")
    return item

def validate_ids(session, model, ids, user_id):
    return [owned(session, model, item_id, user_id) for item_id in sorted(set(ids))]

def game_public(session, game):
    tags = session.exec(select(Tag).join(GameTagLink, Tag.id == GameTagLink.tag_id).where(GameTagLink.game_id == game.id)).all()
    result = game.model_dump(exclude={"owner_id"})
    result["tags"] = [{"id": t.id, "name": t.name} for t in tags]
    return result
