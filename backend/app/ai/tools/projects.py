from __future__ import annotations

from typing import Any

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.ai.context import AIAccessContext
from app.ai.schemas import AIToolCall
from app.models.enums import ProjectStatus
from app.services.project_service import ProjectService


def list_my_accessible_projects(
    db: Session,
    ctx: AIAccessContext,
    *,
    q: str | None = None,
    status: ProjectStatus | None = None,
    limit: int = 20,
    offset: int = 0,
) -> AIToolCall:
    if "project.read" not in ctx.permission_keys:
        return AIToolCall(
            name="list_my_accessible_projects",
            ok=False,
            error="You do not have permission to read projects.",
        )

    items, total = ProjectService.list_projects(
        db,
        q=q,
        status_=status,
        limit=limit,
        offset=offset,
    )

    encoded_items: list[dict[str, Any]] = jsonable_encoder(items)

    return AIToolCall(
        name="list_my_accessible_projects",
        ok=True,
        data={
            "items": encoded_items,
            "total": total,
            "limit": limit,
            "offset": offset,
        },
    )