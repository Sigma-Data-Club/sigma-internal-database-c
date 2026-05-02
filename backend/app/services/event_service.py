from __future__ import annotations

from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.models.event import Event


class EventService:
    @staticmethod
    def list_events(db: Session, *, limit: int, offset: int) -> tuple[list[Event], int]:
        total = db.scalar(select(func.count()).select_from(Event)) or 0
        rows = db.scalars(
            select(Event)
            .order_by(Event.start_datetime.desc(), Event.event_id.desc())
            .offset(offset)
            .limit(limit)
        ).all()
        return rows, total

    @staticmethod
    def get_event_by_id(db: Session, *, event_id: int) -> Event:
        ev = db.get(Event, event_id)
        if not ev:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Event not found",
                    details={"event_id": event_id},
                ),
            )
        return ev

    @staticmethod
    def _validate_times(start: datetime | None, end: datetime | None) -> None:
        if start is not None and end is not None and end < start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "end_datetime must be >= start_datetime",
                    details={"start_datetime": str(start), "end_datetime": str(end)},
                ),
            )

    @staticmethod
    def create_event(
        db: Session,
        *,
        title: str,
        start_datetime: datetime,
        end_datetime: datetime | None,
        speaker_name: str | None,
        topic: str | None,
        created_by_member_id: int | None,
    ) -> Event:
        EventService._validate_times(start_datetime, end_datetime)

        ev = Event(
            title=title,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            speaker_name=speaker_name,
            topic=topic,
            created_by_member_id=created_by_member_id,
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)
        return ev

    @staticmethod
    def update_event(db: Session, *, event_id: int, data) -> Event:
        ev = EventService.get_event_by_id(db, event_id=event_id)
        patch = data.model_dump(exclude_unset=True)

        new_start = patch.get("start_datetime", ev.start_datetime)
        new_end = patch.get("end_datetime", ev.end_datetime)
        EventService._validate_times(new_start, new_end)

        for k, v in patch.items():
            setattr(ev, k, v)

        db.add(ev)
        db.commit()
        db.refresh(ev)
        return ev

    @staticmethod
    def delete_event(db: Session, *, event_id: int) -> None:
        ev = EventService.get_event_by_id(db, event_id=event_id)
        db.delete(ev)
        db.commit()