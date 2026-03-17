from __future__ import annotations

from app.ai.context import AIAccessContext
from app.ai.schemas import AIToolCall


def get_my_profile(ctx: AIAccessContext) -> AIToolCall:
    m = ctx.member
    return AIToolCall(
        name="get_my_profile",
        ok=True,
        data={
            "member_id": m.member_id,
            "first_name": m.first_name,
            "last_name": m.last_name,
            "email": m.email,
            "phone": m.phone,
            "academic_program_id": m.academic_program_id,
            "study_year": m.study_year,
            "is_active": m.is_active,
        },
    )