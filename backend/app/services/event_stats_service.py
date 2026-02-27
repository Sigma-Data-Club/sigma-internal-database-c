from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select, func, case
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.models.event import Event
from app.models.event_application import EventApplication
from app.models.member import Member
from app.models.enums import DecisionStatus, AttendanceStatus, AttendanceMode


class EventStatsService:
    @staticmethod
    def _ensure_member_exists(db: Session, *, member_id: int) -> None:
        if not db.get(Member, member_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Member not found",
                    details={"member_id": member_id},
                ),
            )

    @staticmethod
    def _ensure_event_exists(db: Session, *, event_id: int) -> None:
        if not db.get(Event, event_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Event not found",
                    details={"event_id": event_id},
                ),
            )

    @staticmethod
    def list_member_events(
        db: Session,
        *,
        member_id: int,
        limit: int,
        offset: int,
        attended_only: bool,
        decision_status: DecisionStatus | None,
    ) -> tuple[list[tuple[EventApplication, Event]], int]:
        EventStatsService._ensure_member_exists(db, member_id=member_id)

        q = (
            select(EventApplication, Event)
            .join(Event, Event.event_id == EventApplication.event_id)
            .where(EventApplication.member_id == member_id)
        )

        if attended_only:
            q = q.where(EventApplication.attendance_status == AttendanceStatus.attended)

        if decision_status is not None:
            q = q.where(EventApplication.decision_status == decision_status)

        total = db.scalar(select(func.count()).select_from(q.subquery())) or 0

        rows = db.execute(
            q.order_by(Event.start_datetime.desc(), Event.event_id.desc())
            .offset(offset)
            .limit(limit)
        ).all()

        return rows, total

    @staticmethod
    def member_summary(db: Session, *, member_id: int):
        EventStatsService._ensure_member_exists(db, member_id=member_id)

        stmt = select(
            func.count().label("total_applied"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.accepted, 1), else_=0)).label("accepted"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.rejected, 1), else_=0)).label("rejected"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.pending, 1), else_=0)).label("pending"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.waitlisted, 1), else_=0)).label("waitlisted"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.cancelled, 1), else_=0)).label("cancelled"),
            func.sum(case((EventApplication.attendance_status == AttendanceStatus.attended, 1), else_=0)).label("attended"),
            func.sum(case((EventApplication.attendance_status == AttendanceStatus.no_show, 1), else_=0)).label("no_show"),
            func.sum(case((EventApplication.attendance_status == AttendanceStatus.unknown, 1), else_=0)).label("unknown_attendance"),
            func.avg(EventApplication.feedback_rating).label("avg_feedback_rating"),
        ).where(EventApplication.member_id == member_id)

        return db.execute(stmt).one()

    @staticmethod
    def list_event_attendance(
        db: Session,
        *,
        event_id: int,
        limit: int,
        offset: int,
    ) -> tuple[list[EventApplication], int]:
        EventStatsService._ensure_event_exists(db, event_id=event_id)

        total = db.scalar(
            select(func.count())
            .select_from(EventApplication)
            .where(EventApplication.event_id == event_id)
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
    def event_stats(db: Session, *, event_id: int):
        EventStatsService._ensure_event_exists(db, event_id=event_id)

        stmt = select(
            func.count().label("total_applications"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.accepted, 1), else_=0)).label("accepted"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.rejected, 1), else_=0)).label("rejected"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.pending, 1), else_=0)).label("pending"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.waitlisted, 1), else_=0)).label("waitlisted"),
            func.sum(case((EventApplication.decision_status == DecisionStatus.cancelled, 1), else_=0)).label("cancelled"),
            func.sum(case((EventApplication.attendance_status == AttendanceStatus.attended, 1), else_=0)).label("attended"),
            func.sum(case((EventApplication.attendance_status == AttendanceStatus.no_show, 1), else_=0)).label("no_show"),
            func.sum(case((EventApplication.attendance_status == AttendanceStatus.unknown, 1), else_=0)).label("unknown_attendance"),
            func.sum(case((EventApplication.attendance_mode == AttendanceMode.online, 1), else_=0)).label("online"),
            func.sum(case((EventApplication.attendance_mode == AttendanceMode.in_person, 1), else_=0)).label("in_person"),
            func.avg(EventApplication.feedback_rating).label("avg_feedback_rating"),
        ).where(EventApplication.event_id == event_id)

        return db.execute(stmt).one()