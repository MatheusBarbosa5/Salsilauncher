from typing import Optional

from sqlalchemy import or_
from sqlmodel import Session, select

from models.users import User, UserCreate, UserUpdate


# Obter usuários
def get_users(
    session: Session,
    q: Optional[str] = None,
    limit: int = 25,
    offset: int = 0
):
    stmt = select(User)

    if q:
        q_like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                User.username.ilike(q_like),
                User.display_name.ilike(q_like),
                User.email.ilike(q_like)
            )
        )

    stmt = stmt.offset(offset).limit(limit)

    return session.exec(stmt).all()


# Obter usuário por ID
def get_user(
    session: Session,
    user_id: int
) -> User | None:

    return session.get(User, user_id)


# Criar usuário
def create_user(
    session: Session,
    user_data: UserCreate
) -> User:

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=user_data.password_hash,
        display_name=user_data.display_name,
        avatar_url=user_data.avatar_url,
        steam_id=user_data.steam_id,
        language=user_data.language,
        theme=user_data.theme
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


# Atualizar usuário
def update_user(
    session: Session,
    user_id: int,
    user_data: UserUpdate
) -> User | None:

    user_db = session.get(User, user_id)

    if user_db is None:
        return None

    update_data = user_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(user_db, field, value)

    session.add(user_db)
    session.commit()
    session.refresh(user_db)

    return user_db


# Deletar usuário
def delete_user(
    session: Session,
    user_id: int
) -> bool:

    user_db = session.get(User, user_id)

    if not user_db:
        return False

    session.delete(user_db)
    session.commit()

    return True