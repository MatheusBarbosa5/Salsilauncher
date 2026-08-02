from typing import List

from sqlmodel import Session, select

from models.friendships import (
    Friendship,
    FriendshipCreate,
    FriendshipUpdate
)

from repositories import friendshipsRepository as friendshipRepository


# Enviar pedido de amizade
def create_friend_request(
    session: Session,
    user_id: int,
    friendship: FriendshipCreate
) -> Friendship:

    if user_id == friendship.friend_id:
        raise ValueError(
            "Você não pode enviar pedido para você mesmo"
        )

    existing = friendshipRepository.get_existing_friendship(
        session=session,
        user_id=user_id,
        friend_id=friendship.friend_id
    )

    if existing:
        raise ValueError(
            "Já existe uma amizade ou pedido entre esses usuários"
        )

    return friendshipRepository.create_friend_request(
        session=session,
        user_id=user_id,
        friendship_data=friendship
    )


# Obter pedidos recebidos
def get_friend_requests(
    session: Session,
    user_id: int
) -> List[Friendship]:

    return friendshipRepository.get_friend_requests(
        session=session,
        user_id=user_id
    )


# Obter amigos
def get_friends(
    session: Session,
    user_id: int
) -> List[Friendship]:

    return friendshipRepository.get_friends(
        session=session,
        user_id=user_id
    )


# Obter amizade
def get_friendship(
    session: Session,
    friendship_id: int
) -> Friendship | None:

    return friendshipRepository.get_friendship(
        session=session,
        friendship_id=friendship_id
    )


# Atualizar amizade
def update_friendship(
    session: Session,
    friendship_id: int,
    friendship_update: FriendshipUpdate
) -> Friendship | None:

    return friendshipRepository.update_friendship(
        session=session,
        friendship_id=friendship_id,
        friendship_update=friendship_update
    )


# Deletar amizade
def delete_friendship(
    session: Session,
    friendship_id: int
) -> bool:

    return friendshipRepository.delete_friendship(
        session=session,
        friendship_id=friendship_id
    )