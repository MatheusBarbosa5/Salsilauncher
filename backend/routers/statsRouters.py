from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database import get_session
from services import statsService

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/capsule")
def get_capsule(
    year: int | None = Query(None, ge=2000, le=2100),
    session: Session = Depends(get_session),
):
    return statsService.build_capsule(session, year or datetime.now().year)
