from typing import List

from sqlmodel import Session, select

from models.friendships import Friendship, FriendshipCreate, FriendshipUpdate
from models.users import User


# Funções auxiliares
def get_existing_friendship(
    session: Session,
    user_id: int,
    friend_id: int
) -> Friendship | None:

    stmt = select(Friendship).where(
        (
            (Friendship.user_id == user_id) &
            (Friendship.friend_id == friend_id)
        )
        |
        (
            (Friendship.user_id == friend_id) &
            (Friendship.friend_id == user_id)
        )
    )

    return session.exec(stmt).first()

# Enviar pedido de amizade
def create_friend_request(
    session: Session,
    user_id: int,
    friendship_data: FriendshipCreate
) -> Friendship:

    friendship = Friendship(
        user_id=user_id,
        friend_id=friendship_data.friend_id,
        status="pending"
    )

    session.add(friendship)
    session.commit()
    session.refresh(friendship)

    return friendship


# Buscar pedidos recebidos
def get_friend_requests(
    session: Session,
    user_id: int
) -> List[Friendship]:

    stmt = select(Friendship).where(
        Friendship.friend_id == user_id,
        Friendship.status == "pending"
    )

    return session.exec(stmt).all()


# Buscar amizades aceitas
def get_friends(
    session: Session,
    user_id: int
) -> List[Friendship]:

    stmt = select(Friendship).where(
        (
            (Friendship.user_id == user_id) |
            (Friendship.friend_id == user_id)
        ),
        Friendship.status == "accepted"
    )

    return session.exec(stmt).all()


# Buscar uma amizade pelo ID
def get_friendship(
    session: Session,
    friendship_id: int
) -> Friendship | None:

    return session.get(
        Friendship,
        friendship_id
    )


# Atualizar status da amizade
def update_friendship(
    session: Session,
    friendship_id: int,
    friendship_update: FriendshipUpdate
) -> Friendship | None:

    friendship_db = session.get(
        Friendship,
        friendship_id
    )

    if friendship_db is None:
        return None

    update_data = friendship_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            friendship_db,
            field,
            value
        )

    session.add(friendship_db)
    session.commit()
    session.refresh(friendship_db)

    return friendship_db


# Deletar pedido ou amizade
def delete_friendship(
    session: Session,
    friendship_id: int
) -> bool:

    friendship_db = session.get(
        Friendship,
        friendship_id
    )

    if not friendship_db:
        return False

    session.delete(friendship_db)
    session.commit()

    return True