# Definir formato dos dados da API (Request e Response) | DTO
from sqlmodel import SQLModel

# Request
class SteamAccountLinkRequest(SQLModel):
    profile_url: str

# Response
class SteamAccountLinkResponse(SQLModel):
    steam_id: str
    profile_url: str
    linked: bool

# Response (Sincronização da Biblioteca)
class SteamLibrarySyncResponse(SQLModel):
    imported: int
    existing: int
    total: int