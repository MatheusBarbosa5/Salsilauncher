from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional

from models.games import Game, GameCreate, GameUpdate


def get_games(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0
) -> List[Game]:

    stmt = select(Game)

    if q:
        q_like = f"%{q.lower()}%"

        stmt = stmt.where(
            or_(
                Game.title.ilike(q_like),
                Game.description.ilike(q_like)
            )
        )

    stmt = stmt.offset(offset).limit(limit)

    return session.exec(stmt).all()


def get_game_by_id(
    session: Session,
    game_id: int
) -> Game | None:

    return session.get(Game, game_id)


def create_game(
    session: Session,
    game_data: GameCreate
) -> Game:

    data = game_data.model_dump()

    new_game = Game(**data)

    session.add(new_game)
    session.commit()
    session.refresh(new_game)

    return new_game


def update_game(
    session: Session,
    game_id: int,
    game_data: GameUpdate
) -> Game | None:

    game_db = session.get(Game, game_id)

    if not game_db:
        return None

    update_dict = game_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():

        if hasattr(game_db, key):
            setattr(game_db, key, value)

    session.add(game_db)
    session.commit()
    session.refresh(game_db)

    return game_db


def delete_game(
    session: Session,
    game_id: int
) -> bool:

    game_db = session.get(Game, game_id)

    if not game_db:
        return False

    game_db.is_active = False

    session.commit()

    return True


def get_game_by_steam_appid(
    session: Session,
    steam_appid: int
) -> Game | None:

    statement = select(Game).where(
        Game.steam_appid == steam_appid
    )

    return session.exec(statement).first()