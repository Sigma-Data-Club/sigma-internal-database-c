from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.models.event import Event
from app.models.event_application import EventApplication
from app.models.enums import AttendanceStatus


class EventApplicationService:
    @staticmethod
    def _ensure_event_exists(db: Session, *, event_id: int) -> None:
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

    @staticmethod
    def list_event_applications(
        db: Session, *, event_id: int, limit: int, offset: int
    ) -> tuple[list[EventApplication], int]:
        EventApplicationService._ensure_event_exists(db, event_id=event_id)

        total = db.scalar(
            select(func.count()).select_from(EventApplication).where(EventApplication.event_id == event_id)
        ) or 0

        rows = db.scalars(
            select(EventApplication)
            .where(EventApplication.event_id == event_id)
            .order_by(EventApplication.applied_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()

        return rows, total

    @staticmethod
    def get_application(db: Session, *, event_id: int, member_id: int) -> EventApplication:
        EventApplicationService._ensure_event_exists(db, event_id=event_id)

        app = db.get(EventApplication, {"event_id": event_id, "member_id": member_id})
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Event application not found",
                    details={"event_id": event_id, "member_id": member_id},
                ),
            )
        return app

    @staticmethod
    def apply(db: Session, *, event_id: int, member_id: int, attendance_mode) -> EventApplication:
        EventApplicationService._ensure_event_exists(db, event_id=event_id)

        app = EventApplication(
            event_id=event_id,
            member_id=member_id,
            attendance_mode=attendance_mode,
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def decide(db: Session, *, event_id: int, member_id: int, decision_status) -> EventApplication:
        app = EventApplicationService.get_application(db, event_id=event_id, member_id=member_id)
        app.decision_status = decision_status
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def update_attendance(
        db: Session,
        *,
        event_id: int,
        member_id: int,
        attendance_status,
        attendance_mode,
    ) -> EventApplication:
        app = EventApplicationService.get_application(db, event_id=event_id, member_id=member_id)
        app.attendance_status = attendance_status
        app.attendance_mode = attendance_mode
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def submit_feedback(
        db: Session,
        *,
        event_id: int,
        member_id: int,
        rating: int,
        comment: str | None,
    ) -> EventApplication:
        """
        Rules:
        - application must exist
        - rating must be 1..5
        - (recommended) only allow feedback if attendance_status == attended
        - stores feedback inside event_application (rating/comment/submitted_at)
        """
        if rating < 1 or rating > 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "rating must be an integer from 1 to 5",
                    details={"field": "rating", "value": rating},
                ),
            )

        app = EventApplicationService.get_application(db, event_id=event_id, member_id=member_id)

        if app.attendance_status != AttendanceStatus.attended:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Feedback can be submitted only for attended applications",
                    details={
                        "event_id": event_id,
                        "member_id": member_id,
                        "attendance_status": str(app.attendance_status),
                    },
                ),
            )

        app.feedback_rating = rating
        app.feedback_comment = (comment.strip() if isinstance(comment, str) else None) or None
        app.feedback_submitted_at = datetime.now(timezone.utc)

        db.add(app)
        db.commit()
        db.refresh(app)
        return app