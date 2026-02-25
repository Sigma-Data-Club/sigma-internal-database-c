from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import decode_access_token
from app.core.errors import ErrorCode, error_payload
from app.models.member import Member
from app.models.auth_session import AuthSession

security = HTTPBearer()


def get_current_session(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AuthSession:
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Invalid token type"),
        )

    sub = payload.get("sub")
    sid = payload.get("sid")

    if not sub or not sid:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Token missing claims"),
        )

    try:
        member_id = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Invalid sub claim"),
        )

    try:
        session_id = uuid.UUID(str(sid))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Invalid sid claim"),
        )

    session = db.get(AuthSession, session_id)
    if not session:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_SESSION_NOT_FOUND, "Session not found"),
        )

    if session.member_id != member_id:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Session/member mismatch"),
        )

    if session.revoked_at:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_SESSION_REVOKED, "Session revoked"),
        )

    now = datetime.now(timezone.utc)
    if session.expires_at is not None and session.expires_at <= now:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_SESSION_EXPIRED, "Session expired"),
        )

    return session


def get_current_member(
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> Member:
    member = db.get(Member, session.member_id)
    if not member:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Member not found"),
        )
    return member


def require_active_member(member: Member = Depends(get_current_member)) -> Member:
    if not getattr(member, "is_active", True):
        raise HTTPException(
            status_code=403,
            detail=error_payload(ErrorCode.AUTH_INACTIVE_MEMBER, "Inactive member"),
        )
    return member