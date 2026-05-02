from __future__ import annotations

from sqlalchemy.orm import Session

from app.ai.context import AIAccessContext
from app.ai.schemas import AIToolCall
from app.services.event_service import EventService


def list_my_accessible_events(
    db: Session,
    ctx: AIAccessContext,
    *,
    limit: int = 20,
    offset: int = 0,
) -> AIToolCall:
    if "event.read" not in ctx.permission_keys:
        return AIToolCall(
            name="list_my_accessible_events",
            ok=False,
            error="You do not have permission to read events.",
        )

    items, total = EventService.list_events(db, limit=limit, offset=offset)

    data = []
    for ev in items:
        data.append(
            {
                "event_id": ev.event_id,
                "title": ev.title,
                "start_datetime": ev.start_datetime,
                "end_datetime": ev.end_datetime,
                "speaker_name": ev.speaker_name,
                "topic": ev.topic,
                "created_by_member_id": ev.created_by_member_id,
                "created_at": ev.created_at,
            }
        )

    return AIToolCall(
        name="list_my_accessible_events",
        ok=True,
        data={
            "items": data,
            "total": total,
            "limit": limit,
            "offset": offset,
        },
    )