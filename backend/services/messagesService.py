from typing import List

from sqlmodel import Session

from models.messages import (
    Messages,
    MessagesCreate
)

from repositories.messagesRepository import (
    create_message,
    get_message,
    get_received_messages,
    get_sent_messages,
    get_conversation,
    count_unread_messages,
    mark_message_as_read,
    delete_message
)


# Enviar mensagem

def send_message(
    session: Session,
    user_id: int,
    message_data: MessagesCreate
) -> Messages:

    # Não permite enviar mensagem para si mesmo
    if user_id == message_data.receiver_id:
        raise ValueError(
            "Você não pode enviar uma mensagem para si mesmo."
        )

    return create_message(
        session,
        user_id,
        message_data
    )


# Buscar mensagens recebidas

def get_inbox(
    session: Session,
    user_id: int
) -> List[Messages]:

    return get_received_messages(
        session,
        user_id
    )


# Buscar mensagens enviadas

def get_sent(
    session: Session,
    user_id: int
) -> List[Messages]:

    return get_sent_messages(
        session,
        user_id
    )


# Buscar uma mensagem

def get_message_by_id(
    session: Session,
    message_id: int
) -> Messages | None:

    return get_message(
        session,
        message_id
    )


# Buscar conversa entre dois usuários

def get_user_conversation(
    session: Session,
    user_id: int,
    other_user_id: int
) -> List[Messages]:

    if user_id == other_user_id:
        raise ValueError(
            "Não é possível abrir uma conversa consigo mesmo."
        )

    return get_conversation(
        session,
        user_id,
        other_user_id
    )


# Marcar mensagem como lida

def read_message(
    session: Session,
    message_id: int,
    user_id: int
) -> Messages | None:

    message = get_message(
        session,
        message_id
    )

    if message is None:
        return None

    # Apenas o destinatário pode marcar como lida
    if message.receiver_id != user_id:
        raise PermissionError(
            "Você não pode marcar esta mensagem como lida."
        )

    # Se já estiver lida, não precisa atualizar novamente
    if message.read_at is not None:
        return message

    return mark_message_as_read(
        session,
        message_id
    )


# Contar mensagens não lidas

def get_unread_count(
    session: Session,
    user_id: int
) -> int:

    return count_unread_messages(
        session,
        user_id
    )


# Deletar mensagem

def remove_message(
    session: Session,
    message_id: int,
    user_id: int
) -> bool:

    message = get_message(
        session,
        message_id
    )

    if message is None:
        return False

    # Apenas o remetente pode excluir a mensagem
    if message.sender_id != user_id:
        raise PermissionError(
            "Você não pode excluir esta mensagem."
        )

    return delete_message(
        session,
        message_id
    )