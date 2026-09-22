from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from database import get_session

from models.messages import (
    Messages,
    MessagesCreate
)

from services.messagesService import (
    send_message,
    get_inbox,
    get_sent,
    get_message_by_id,
    get_user_conversation,
    read_message,
    get_unread_count,
    remove_message
)


router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)


# Criar / enviar mensagem

@router.post(
    "/",
    response_model=Messages,
    status_code=status.HTTP_201_CREATED
)
def create_message(
    message_data: MessagesCreate,
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    # Depois deve vir do usuário autenticado.
    user_id = 1

    try:
        return send_message(
            session,
            user_id,
            message_data
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# Mensagens recebidas

@router.get(
    "/inbox",
    response_model=List[Messages]
)
def get_messages_inbox(
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    user_id = 1

    return get_inbox(
        session,
        user_id
    )


# Mensagens enviadas

@router.get(
    "/sent",
    response_model=List[Messages]
)
def get_messages_sent(
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    user_id = 1

    return get_sent(
        session,
        user_id
    )


# Buscar conversa

@router.get(
    "/conversation/{other_user_id}",
    response_model=List[Messages]
)
def get_conversation_messages(
    other_user_id: int,
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    user_id = 1

    try:
        return get_user_conversation(
            session,
            user_id,
            other_user_id
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# Contar mensagens não lidas

@router.get(
    "/unread/count"
)
def unread_messages_count(
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    user_id = 1

    return {
        "unread": get_unread_count(
            session,
            user_id
        )
    }


# Buscar mensagem pelo ID

@router.get(
    "/{message_id}",
    response_model=Messages
)
def get_message(
    message_id: int,
    session: Session = Depends(get_session)
):
    message = get_message_by_id(
        session,
        message_id
    )

    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada."
        )

    return message


# Marcar mensagem como lida

@router.patch(
    "/{message_id}/read",
    response_model=Messages
)
def mark_as_read(
    message_id: int,
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    user_id = 1

    try:
        message = read_message(
            session,
            message_id,
            user_id
        )

        if message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensagem não encontrada."
            )

        return message

    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error)
        )


# Deletar mensagem

@router.delete(
    "/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_message(
    message_id: int,
    session: Session = Depends(get_session)
):
    # Temporariamente definido apenas para teste.
    user_id = 1

    try:
        deleted = remove_message(
            session,
            message_id,
            user_id
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensagem não encontrada."
            )

    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error)
        )

    return None