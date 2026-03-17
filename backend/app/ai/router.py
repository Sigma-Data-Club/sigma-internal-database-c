from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.agent import ReadOnlyClubAgent
from app.ai.schemas import AIChatRequest, AIChatResponse
from app.core.auth_dependencies import require_active_member
from app.core.dependencies import get_db
from app.models.member import Member


router = APIRouter(prefix="/ai", tags=["ai"])

_agent = ReadOnlyClubAgent()


@router.post("/chat", response_model=AIChatResponse)
def chat_with_ai(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_member: Member = Depends(require_active_member),
):
    return _agent.run(
        db=db,
        current_member=current_member,
        message=payload.message,
        include_debug=payload.include_debug,
    )