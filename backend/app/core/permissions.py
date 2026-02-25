from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Iterable, Literal, Union

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.errors import ErrorCode, error_payload
from app.core.security import decode_access_token
from app.core.admin_guard import require_admin_key

from app.models.member import Member
from app.models.auth_session import AuthSession

from app.models.member_role import MemberRole
from app.models.role_permission import RolePermission
from app.models.permission import Permission

PermissionArg = Union[str, Iterable[str]]
Mode = Literal["all", "any"]

_optional_bearer = HTTPBearer(auto_error=False)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _load_session_from_access_token(db: Session, token: str) -> AuthSession:
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

    if session.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_SESSION_REVOKED, "Session revoked"),
        )

    now = _utcnow()
    if session.expires_at is not None and session.expires_at <= now:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_SESSION_EXPIRED, "Session expired"),
        )

    return session


def _load_active_member(db: Session, member_id: int) -> Member:
    member = db.get(Member, member_id)
    if not member:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Member not found"),
        )

    if not getattr(member, "is_active", True):
        raise HTTPException(
            status_code=403,
            detail=error_payload(ErrorCode.AUTH_INACTIVE_MEMBER, "Inactive member"),
        )

    return member


def get_member_permission_keys(db: Session, member_id: int) -> set[str]:
    stmt = (
        select(Permission.key)
        .select_from(MemberRole)
        .join(RolePermission, RolePermission.role_id == MemberRole.role_id)
        .join(Permission, Permission.permission_id == RolePermission.permission_id)
        .where(MemberRole.member_id == member_id)
        .distinct()
    )
    rows = db.execute(stmt).all()
    return {r[0] for r in rows}


def require_permissions(perms: PermissionArg, *, mode: Mode = "all"):
    required = [perms] if isinstance(perms, str) else list(perms)

    def _dep(
        creds: HTTPAuthorizationCredentials = Depends(_optional_bearer),
        db: Session = Depends(get_db),
    ) -> Member:
        if creds is None:
            raise HTTPException(
                status_code=401,
                detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Missing Bearer token"),
            )

        session = _load_session_from_access_token(db, creds.credentials)
        member = _load_active_member(db, session.member_id)

        user_perms = get_member_permission_keys(db, member.member_id)

        if mode == "all":
            missing = [p for p in required if p not in user_perms]
            if missing:
                raise HTTPException(
                    status_code=403,
                    detail=error_payload(
                        ErrorCode.PERMISSION_DENIED,
                        "Permission denied",
                        details={"mode": "all", "missing": missing, "required": required},
                    ),
                )
        else:  # any
            if not any(p in user_perms for p in required):
                raise HTTPException(
                    status_code=403,
                    detail=error_payload(
                        ErrorCode.PERMISSION_DENIED,
                        "Permission denied",
                        details={"mode": "any", "required_any_of": required},
                    ),
                )

        return member

    return _dep


def require_permission(perm: str):
    # alias for readability
    return require_permissions(perm, mode="all")


def require_admin_or_permissions(perms: PermissionArg, *, mode: Mode = "all"):
    """
    If X-Admin-Key is present and valid -> allow (no JWT needed).
    Otherwise -> require JWT access + active member + permissions.
    """
    required = [perms] if isinstance(perms, str) else list(perms)

    def _dep(
        x_admin_key: str | None = Header(default=None),
        creds: HTTPAuthorizationCredentials = Depends(_optional_bearer),
        db: Session = Depends(get_db),
    ) -> Member | None:
        # Admin-key bypass
        if x_admin_key is not None:
            require_admin_key(x_admin_key)
            return None

        # No admin key -> enforce permissions (needs bearer)
        if creds is None:
            raise HTTPException(
                status_code=401,
                detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Missing Bearer token"),
            )

        session = _load_session_from_access_token(db, creds.credentials)
        member = _load_active_member(db, session.member_id)

        user_perms = get_member_permission_keys(db, member.member_id)

        if mode == "all":
            missing = [p for p in required if p not in user_perms]
            if missing:
                raise HTTPException(
                    status_code=403,
                    detail=error_payload(
                        ErrorCode.PERMISSION_DENIED,
                        "Permission denied",
                        details={"mode": "all", "missing": missing, "required": required},
                    ),
                )
        else:
            if not any(p in user_perms for p in required):
                raise HTTPException(
                    status_code=403,
                    detail=error_payload(
                        ErrorCode.PERMISSION_DENIED,
                        "Permission denied",
                        details={"mode": "any", "required_any_of": required},
                    ),
                )

        return member

    return _dep