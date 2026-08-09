from sqlmodel import Session, select

from models.userGame import UserGame, UserGameCreate, UserGameUpdate

# Adicionar jogo à biblioteca
def create_user_game(
    session: Session,
    user_id: int,
    user_game: UserGameCreate
) -> UserGame:

    db_user_game = UserGame(
        user_id=user_id,
        game_id=user_game.game_id,
        is_favorite=user_game.is_favorite,
        is_hidden=user_game.is_hidden,
        last_played_at=user_game.last_played_at,
        custom_title=user_game.custom_title,
        notes=user_game.notes
    )

    session.add(db_user_game)
    session.commit()
    session.refresh(db_user_game)

    return db_user_game

# Obter jogos do usuário
def get_user_games(
    session: Session,
    user_id: int
) -> list[UserGame]:

    statement = select(UserGame).where(
        UserGame.user_id == user_id
    )

    return list(session.exec(statement).all())

# Obter relação usuário + jogo
def get_user_game(
    session: Session,
    user_id: int,
    game_id: int
) -> UserGame | None:

    statement = select(UserGame).where(
        UserGame.user_id == user_id,
        UserGame.game_id == game_id
    )

    return session.exec(statement).first()


def get_by_user(
    session: Session,
    user_id: int
) -> list[UserGame]:

    statement = select(UserGame).where(
        UserGame.user_id == user_id
    )

    return list(session.exec(statement).all())


def get_by_game(
    session: Session,
    game_id: int
) -> list[UserGame]:

    statement = select(UserGame).where(
        UserGame.game_id == game_id
    )

    return list(session.exec(statement).all())

# Atualizar jogo do usuário
def update_user_game(
    session: Session,
    user_id: int,
    game_id: int,
    user_game_data: UserGameUpdate
) -> UserGame | None:

    statement = select(UserGame).where(
        UserGame.user_id == user_id,
        UserGame.game_id == game_id
    )

    user_game = session.exec(statement).first()

    if not user_game:
        return None

    update_data = user_game_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(user_game, key, value)

    session.add(user_game)
    session.commit()
    session.refresh(user_game)

    return user_game

# Remover jogo da biblioteca
def delete_user_game(
    session: Session,
    user_id: int,
    game_id: int
) -> bool:

    statement = select(UserGame).where(
        UserGame.user_id == user_id,
        UserGame.game_id == game_id
    )

    user_game = session.exec(statement).first()

    if not user_game:
        return False

    session.delete(user_game)
    session.commit()

    return True