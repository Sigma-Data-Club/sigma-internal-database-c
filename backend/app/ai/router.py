from __future__ import annotations

import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.agent import ReadOnlyClubAgent
from app.ai.schemas import AIChatRequest, AIChatResponse
from app.core.auth_dependencies import require_active_member
from app.core.dependencies import get_db
from app.core.errors import ErrorCode, error_payload
from app.models.member import Member

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

_agent = ReadOnlyClubAgent()


@router.post("/chat", response_model=AIChatResponse)
def chat_with_ai(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_member: Member = Depends(require_active_member),
):
    try:
        logger.info(
            "AI chat request received: member_id=%s, messages_count=%s, include_debug=%s",
            current_member.member_id,
            len(payload.messages),
            payload.include_debug,
        )

        result = _agent.run(
            db=db,
            current_member=current_member,
            messages=payload.messages,
            include_debug=payload.include_debug,
        )

        logger.info(
            "AI chat response generated: member_id=%s, tools_used=%s",
            current_member.member_id,
            result.tools_used,
        )

        return result

    except Exception as exc:
        logger.error(
            "AI chat failed: member_id=%s, error=%s",
            current_member.member_id,
            str(exc),
        )
        logger.error(traceback.format_exc())

        raise HTTPException(
            status_code=500,
            detail=error_payload(
                ErrorCode.INTERNAL_ERROR,
                "AI chat failed",
                details={
                    "error_type": exc.__class__.__name__,
                    "error_message": str(exc),
                },
            ),
        )