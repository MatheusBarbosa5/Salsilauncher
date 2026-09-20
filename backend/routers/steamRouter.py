from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import get_session
from models.steam import (
    SteamAccountLinkRequest,
    SteamAccountLinkResponse,
    SteamLibrarySyncResponse,
)
from repositories import usersRepository as user_repo
from services.steamService import resolve_steam_profile
from services.steamSyncService import sync_user_library


router = APIRouter(
    prefix="/steam",
    tags=["Steam"],
)


## Vinculo de conta

@router.post("/account/link", response_model=SteamAccountLinkResponse)
async def link_steam_account(
    body: SteamAccountLinkRequest,
    session: Session = Depends(get_session),
    user_id: int = 1,  # TODO: trocar por current_user real quando tiver autenticação
):

    # Recebe a URL do perfil Steam e vincula ao usuário."
    try:
        profile = await resolve_steam_profile(body.profile_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    steam_id = profile["steam_id"]

    # Impede vincular um steam_id que já pertence a outro usuário
    existing = user_repo.get_user_by_steam_id(session, steam_id)
    if existing and existing.id != user_id:
        raise HTTPException(
            status_code=409,
            detail="Esta conta Steam já está vinculada a outro usuário.",
        )

    user = user_repo.link_steam_id(session, user_id, steam_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return SteamAccountLinkResponse(
        steam_id=steam_id,
        profile_url=body.profile_url,
        linked=True,
    )


@router.get("/account")
def get_steam_account(
    session: Session = Depends(get_session),
    user_id: int = 1,  # TODO: trocar por current_user real quando tiver autenticação
):
    
    # Retorna o vínculo Steam atual do usuário.
    user = user_repo.get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return {
        "steam_id": user.steam_id,
        "linked": user.steam_id is not None,
    }


@router.delete("/account")
def unlink_steam_account(
    session: Session = Depends(get_session),
    user_id: int = 1,  # TODO: trocar por current_user real quando tiver autenticação
):

    # Remove o vínculo Steam do usuário.
    user = user_repo.unlink_steam_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return {"linked": False, "message": "Conta Steam desvinculada."}


## Biblioteca

@router.post("/library/sync", response_model=SteamLibrarySyncResponse)
async def sync_steam_library(
    session: Session = Depends(get_session),
    user_id: int = 1,  # TODO: trocar por current_user real quando tiver autenticação
):

    # Importa/sincroniza os jogos da conta Steam vinculada.
    try:
        result = await sync_user_library(session, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return SteamLibrarySyncResponse(**result)