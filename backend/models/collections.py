from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from models.games import ColecaoJogoLink

if TYPE_CHECKING:
    from models.games import Jogo

class Colecao(SQLModel, table=True):
    __tablename__ = "colecao"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str

    jogos: List["Jogo"] = Relationship(
        back_populates="colecoes",
        link_model=ColecaoJogoLink
    )