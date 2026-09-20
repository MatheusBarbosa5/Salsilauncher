# Cria/atualiza Game + UserGame
from sqlmodel import Session

from models.games import Game
from repositories import games as game_repo
from repositories import userGameRepository as user_game_repo
from repositories import usersRepository as user_repo
from services.steamService import get_owned_games


# Busca o steam_id do usuário
# Pega os jogos da Steam
# Cria Game se não existir
# Cria UserGame se não existir
async def sync_user_library(
    session: Session,
    user_id: int
) -> dict:
    
    user = user_repo.get_user(session, user_id)
    if not user or not user.steam_id:
        raise ValueError("Usuário não possui conta Steam vinculada.")

    steam_games = await get_owned_games(user.steam_id)

    imported = 0
    existing = 0

    for item in steam_games:
        steam_appid = item["steam_appid"]

        # 1. Busca ou cria o Game
        game = game_repo.get_game_by_steam_appid(session, steam_appid)

        if not game:
            game = Game(
                title=item["title"],
                steam_appid=steam_appid,
                cover=item.get("cover"),
                background=item.get("background"),
                exe_path=None,
                folder_path=None,
            )
            session.add(game)
            session.commit()
            session.refresh(game)
            imported += 1
        else:
            existing += 1

        # 2. Garante a relação UserGame
        user_game_repo.upsert_user_game(
            session=session,
            user_id=user_id,
            game_id=game.id
        )

    return {
        "imported": imported,
        "existing": existing,
        "total": len(steam_games)
    }