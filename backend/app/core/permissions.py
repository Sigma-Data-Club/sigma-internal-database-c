from __future__ import annotations

from typing import Iterable, Literal, Union

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.admin_guard import require_admin_key
from app.core.dependencies import get_db
from app.core.errors import ErrorCode, error_payload
from app.core.auth_dependencies import require_active_member, require_active_member_optional

from app.models.member import Member
from app.models.member_role import MemberRole
from app.models.role_permission import RolePermission
from app.models.permission import Permission

PermissionArg = Union[str, Iterable[str]]
Mode = Literal["all", "any"]


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


def _ensure_permissions(
    *,
    required: list[str],
    mode: Mode,
    user_perms: set[str],
) -> None:
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
        return

    # mode == "any"
    if not any(p in user_perms for p in required):
        raise HTTPException(
            status_code=403,
            detail=error_payload(
                ErrorCode.PERMISSION_DENIED,
                "Permission denied",
                details={"mode": "any", "required_any_of": required},
            ),
        )


def require_permissions(perms: PermissionArg, *, mode: Mode = "all"):
    """
    Strict: requires Bearer access token + active member.
    No JWT/session parsing here — it is handled by auth_dependencies.py.
    """
    required = [perms] if isinstance(perms, str) else list(perms)

    def _dep(
        member: Member = Depends(require_active_member),
        db: Session = Depends(get_db),
    ) -> Member:
        user_perms = get_member_permission_keys(db, member.member_id)
        _ensure_permissions(required=required, mode=mode, user_perms=user_perms)
        return member

    return _dep


def require_permission(perm: str):
    return require_permissions(perm, mode="all")


def require_admin_or_permissions(perms: PermissionArg, *, mode: Mode = "all"):
    """
    If X-Admin-Key is present and valid -> allow (no JWT needed).
    Otherwise -> require Bearer access token + active member + permissions.
    """
    required = [perms] if isinstance(perms, str) else list(perms)

    def _dep(
        x_admin_key: str | None = Header(default=None),
        member: Member | None = Depends(require_active_member_optional),
        db: Session = Depends(get_db),
    ) -> Member | None:
        # Admin-key bypass
        if x_admin_key is not None:
            # Calls existing guard (uses the same error payload format).
            require_admin_key(x_admin_key)
            return None

        # No admin key -> must have authenticated active member
        if member is None:
            raise HTTPException(
                status_code=401,
                detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Missing Bearer token"),
            )

        user_perms = get_member_permission_keys(db, member.member_id)
        _ensure_permissions(required=required, mode=mode, user_perms=user_perms)
        return member

    return _dep