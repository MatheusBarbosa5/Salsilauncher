from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)

from sqlmodel import Session

from models.friendships import (
    Friendship,
    FriendshipCreate,
    FriendshipUpdate
)

from services import friendshipsService

from database import get_session


router = APIRouter(
    prefix="/friendships",
    tags=["Friendships"]
)


# Enviar pedido de amizade
@router.post("/", response_model=Friendship, status_code=201)
def create_friend_request(
    friendship: FriendshipCreate,
    user_id: int,
    session: Session = Depends(get_session)
):
    try:
        return friendshipsService.create_friend_request(
            session=session,
            user_id=user_id,
            friendship=friendship
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# Ver pedidos recebidos
@router.get("/requests", response_model=list[Friendship])
def get_friend_requests(
    user_id: int,
    session: Session = Depends(get_session)
):
    return friendshipsService.get_friend_requests(
        session=session,
        user_id=user_id
    )


# Ver amigos
@router.get("/", response_model=list[Friendship])
def get_friends(
    user_id: int,
    session: Session = Depends(get_session)
):
    return friendshipsService.get_friends(
        session=session,
        user_id=user_id
    )


# Buscar amizade pelo ID
@router.get("/{friendship_id}", response_model=Friendship)
def get_friendship(
    friendship_id: int,
    session: Session = Depends(get_session)
):
    friendship = friendshipsService.get_friendship(
        session=session,
        friendship_id=friendship_id
    )

    if not friendship:
        raise HTTPException(
            status_code=404,
            detail="Friendship not found"
        )

    return friendship


# Aceitar / alterar status do pedido
@router.put("/{friendship_id}", response_model=Friendship)
def update_friendship(
    friendship_id: int,
    friendship_update: FriendshipUpdate,
    session: Session = Depends(get_session)
):
    updated_friendship = friendshipsService.update_friendship(
        session=session,
        friendship_id=friendship_id,
        friendship_update=friendship_update
    )

    if not updated_friendship:
        raise HTTPException(
            status_code=404,
            detail="Friendship not found"
        )

    return updated_friendship


# Remover amizade ou recusar pedido
@router.delete("/{friendship_id}")
def delete_friendship(
    friendship_id: int,
    session: Session = Depends(get_session)
):
    success = friendshipsService.delete_friendship(
        session=session,
        friendship_id=friendship_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Friendship not found"
        )

    return {
        "message": "Friendship removed successfully"
    }