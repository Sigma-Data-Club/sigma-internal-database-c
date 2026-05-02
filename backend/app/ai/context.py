from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import get_member_permission_keys
from app.models.member import Member
from app.models.member_role import MemberRole
from app.models.role import Role


@dataclass(slots=True)
class AIAccessContext:
    member: Member
    role_names: list[str]
    permission_keys: set[str]


def build_access_context(db: Session, member: Member) -> AIAccessContext:
    role_stmt = (
        select(Role.name)
        .select_from(MemberRole)
        .join(Role, Role.role_id == MemberRole.role_id)
        .where(MemberRole.member_id == member.member_id)
        .distinct()
    )
    role_rows = db.execute(role_stmt).all()
    role_names = sorted(row[0] for row in role_rows)

    permission_keys = get_member_permission_keys(db, member.member_id)

    return AIAccessContext(
        member=member,
        role_names=role_names,
        permission_keys=permission_keys,
    )