from typing import Optional

from sqlalchemy import or_
from sqlmodel import Session, select

from models.gameModels import Game, GameCreate, GameUpdate


# Obter Jogos
def get_games(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
) -> list[Game]:
    stmt = select(Game).where(Game.is_active.is_(True))
    if q:
        q_like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(Game.title.ilike(q_like), Game.description.ilike(q_like))
        )
    stmt = stmt.order_by(Game.title).offset(offset).limit(limit)
    return list(session.exec(stmt).all())


# Obter jogo por ID (interno)
def get_game_by_id(session: Session, game_id: int) -> Game | None:
    return session.get(Game, game_id)


# Obter jogo por Steam AppID (externo, steam)
def get_game_by_steam_appid(session: Session, steam_appid: int) -> Game | None:
    return session.exec(select(Game).where(Game.steam_appid == steam_appid)).first()


# Cria ou reativa a entidade canônica pelo AppID.
def create_game(session: Session, game_data: GameCreate) -> Game:

    if game_data.steam_appid is not None:
        existing = get_game_by_steam_appid(session, game_data.steam_appid)
        if existing:
            for key, value in game_data.model_dump(exclude_unset=True).items():
                if key == "steam_appid" or value is not None:
                    setattr(existing, key, value)
            existing.is_active = True
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    new_game = Game(**game_data.model_dump())
    session.add(new_game)
    session.commit()
    session.refresh(new_game)
    return new_game


# Atualiza os metadados do jogo, se existir.
def update_game(
    session: Session,
    game_id: int,
    game_data: GameUpdate,
) -> Game | None:
    game_db = session.get(Game, game_id)
    if not game_db:
        return None

    for key, value in game_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(game_db, key, value)

    session.add(game_db)
    session.commit()
    session.refresh(game_db)
    return game_db

# Desativa o jogo, sem removê-lo do banco de dados.
def delete_game(session: Session, game_id: int) -> bool:
    game_db = session.get(Game, game_id)
    if not game_db:
        return False

    game_db.is_active = False
    session.add(game_db)
    session.commit()
    return True
