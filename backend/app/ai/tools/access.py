from __future__ import annotations

from app.ai.context import AIAccessContext
from app.ai.schemas import AIToolCall


def get_my_access_profile(ctx: AIAccessContext) -> AIToolCall:
    return AIToolCall(
        name="get_my_access_profile",
        ok=True,
        data={
            "member_id": ctx.member.member_id,
            "is_active": bool(ctx.member.is_active),
            "roles": ctx.role_names,
            "permissions": sorted(ctx.permission_keys),
        },
    )