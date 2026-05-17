from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from models.games import ColecaoGameLink

if TYPE_CHECKING:
    from models.games import Game

class Colecao(SQLModel, table=True):
    __tablename__ = "colecao"
    
    id: int | None = Field(
        default=None,
        primary_key=True
        )
    nome: str

    games: list["Game"] = Relationship(
        back_populates="colecoes",
        link_model=ColecaoGameLink
    )