from typing import List

from sqlmodel import Session, select

from models.messages import (
    Messages,
    MessagesCreate,
    MessagesUpdate
)


# Enviar mensagem

def create_message(
    session: Session,
    user_id: int,
    message_data: MessagesCreate
) -> Messages:

    message = Messages(
        sender_id=user_id,
        receiver_id=message_data.receiver_id,
        content=message_data.content
    )

    session.add(message)
    session.commit()
    session.refresh(message)

    return message


# Buscar mensagens recebidas

def get_received_messages(
    session: Session,
    user_id: int
) -> List[Messages]:

    stmt = select(Messages).where(
        Messages.receiver_id == user_id
    ).order_by(
        Messages.sent_at.desc()
    )

    return session.exec(stmt).all()


# Buscar mensagens enviadas

def get_sent_messages(
    session: Session,
    user_id: int
) -> List[Messages]:

    stmt = select(Messages).where(
        Messages.sender_id == user_id
    ).order_by(
        Messages.sent_at.desc()
    )

    return session.exec(stmt).all()


# Buscar uma mensagem pelo ID

def get_message(
    session: Session,
    message_id: int
) -> Messages | None:

    return session.get(
        Messages,
        message_id
    )


# Buscar conversa entre dois usuários

def get_conversation(
    session: Session,
    user_id: int,
    other_user_id: int
) -> List[Messages]:

    stmt = select(Messages).where(
        (
            (Messages.sender_id == user_id) &
            (Messages.receiver_id == other_user_id)
        )
        |
        (
            (Messages.sender_id == other_user_id) &
            (Messages.receiver_id == user_id)
        )
    ).order_by(
        Messages.sent_at.asc()
    )

    return session.exec(stmt).all()


# Atualizar mensagem

def update_message(
    session: Session,
    message_id: int,
    message_update: MessagesUpdate
) -> Messages | None:

    message_db = session.get(
        Messages,
        message_id
    )

    if message_db is None:
        return None

    update_data = message_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            message_db,
            field,
            value
        )

    session.add(message_db)
    session.commit()
    session.refresh(message_db)

    return message_db


# Marcar mensagem como lida

def mark_message_as_read(
    session: Session,
    message_id: int
) -> Messages | None:

    message_db = session.get(
        Messages,
        message_id
    )

    if message_db is None:
        return None

    from datetime import datetime

    message_db.read_at = datetime.utcnow()

    session.add(message_db)
    session.commit()
    session.refresh(message_db)

    return message_db


# Contar mensagens não lidas

def count_unread_messages(
    session: Session,
    user_id: int
) -> int:

    stmt = select(Messages).where(
        Messages.receiver_id == user_id,
        Messages.read_at.is_(None)
    )

    messages = session.exec(stmt).all()

    return len(messages)


# Deletar mensagem

def delete_message(
    session: Session,
    message_id: int
) -> bool:

    message_db = session.get(
        Messages,
        message_id
    )

    if not message_db:
        return False

    session.delete(message_db)
    session.commit()

    return True