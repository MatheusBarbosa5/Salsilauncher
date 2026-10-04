from sqlmodel import Session, select

from models.UsersModels import User


# Criar usuário
def create_user(
        session: Session,
        user: User
) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# Obeter usuário por ID
def get_user_by_id(
        session: Session,
        user_id: int
) -> User | None:
    statement = select(User).where(User.id == user_id)

    return session.exec(statement).first()

# Obter todos os usuários
def get_users(
        session: Session,
        limit: int = 25,
        offset: int = 0
) -> list[User]:
    statement = select(User).offset(offset).limit(limit)

    return list(session.exec(statement).all())


# Atualizar usuário
def update_user(
    session: Session,
    user: User,
) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


# Deletar usuário
def delete_user(
    session: Session,
    user: User,
) -> None:
    session.delete(user)
    session.commit()