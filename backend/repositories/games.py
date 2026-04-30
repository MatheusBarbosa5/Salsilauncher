from sqlmodel import Session, select
from sqlalchemy import or_
from typing import List, Optional

from models.games import Jogo, JogoCreate, JogoUpdate

def get_all_games(session: Session, q: Optional[str] = None, tags: Optional[str] = None, limit: int = 25, offset: int = 0):
    stmt = select(Jogo)

    if q:
        q_lower = f"%{q.lower()}%"
        stmt = stmt.where(or_(Jogo.nome.ilike(q_lower), Jogo.descricao.ilike(q_lower)))

    # Busca no banco de dados
    jogos = session.exec(stmt).all()

    if tags:
        tags_requisitadas = {t.strip().lower() for t in tags.split(",")}
        jogos = [
            jogo for jogo in jogos
            if tags_requisitadas.issubset({t.lower() for t in jogo.tags})
        ]

    return jogos[offset : offset + limit]

def get_game_by_id(session: Session, jogo_id: int):
    return session.get(Jogo, jogo_id)

def create_game(session: Session, jogo_data: JogoCreate):
    novo_jogo = Jogo(**jogo_data.model_dump())
    session.add(novo_jogo)
    session.commit()
    session.refresh(novo_jogo)
    return novo_jogo

def update_game(session: Session, jogo_id: int, jogo_data: JogoUpdate):
    jogo_db = session.get(Jogo, jogo_id)
    if not jogo_db:
        return None

    # Atualiza apenas os campos que foram enviados
    update_dict = jogo_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(jogo_db, key, value)

    session.add(jogo_db)
    session.commit()
    session.refresh(jogo_db)
    return jogo_db

def delete_game(session: Session, jogo_id: int):
    jogo_db = session.get(Jogo, jogo_id)
    if not jogo_db:
        return False

    session.delete(jogo_db)
    session.commit()
    return True