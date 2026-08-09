from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)

from sqlmodel import Session

from models.userGame import (
    UserGame,
    UserGameCreate,
    UserGameUpdate
)

from services import userGameService
from database import get_session


router = APIRouter(
    prefix="/users/{user_id}/games",
    tags=["User Games"]
)


# Obter jogos do usuário
@router.get("/", response_model=list[UserGame])
def get_user_games(
    user_id: int,
    session: Session = Depends(get_session)
):
    return userGameService.get_user_games(
        session=session,
        user_id=user_id
    )


# Obter relação usuário + jogo
@router.get("/{game_id}", response_model=UserGame)
def get_user_game(
    user_id: int,
    game_id: int,
    session: Session = Depends(get_session)
):
    user_game = userGameService.get_user_game(
        session=session,
        user_id=user_id,
        game_id=game_id
    )

    if not user_game:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontraodo!"
        )

    return user_game


# Adicionar jogo à biblioteca
@router.post("/", response_model=UserGame, status_code=201)
def create_user_game(
    user_id: int,
    user_game: UserGameCreate,
    session: Session = Depends(get_session)
):
    return userGameService.create_user_game(
        session=session,
        user_id=user_id,
        user_game=user_game
    )


# Atualizar jogo do usuário
@router.put("/{game_id}", response_model=UserGame)
def update_user_game(
    user_id: int,
    game_id: int,
    user_game_update: UserGameUpdate,
    session: Session = Depends(get_session)
):
    updated_user_game = userGameService.update_user_game(
        session=session,
        user_id=user_id,
        game_id=game_id,
        user_game_update=user_game_update
    )

    if not updated_user_game:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontraodo!"
        )

    return updated_user_game


# Remover jogo da biblioteca
@router.delete("/{game_id}")
def delete_user_game(
    user_id: int,
    game_id: int,
    session: Session = Depends(get_session)
):
    success = userGameService.delete_user_game(
        session=session,
        user_id=user_id,
        game_id=game_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontraodo!"
        )

    return {"message": "Jogo Removido da biblioteca!"}