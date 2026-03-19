from __future__ import annotations

from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import select, func, case, and_
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

    @staticmethod
    def events_dashboard(
        db: Session,
        *,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        top_limit: int = 10,
    ):
        now = datetime.utcnow()

        event_filters = []
        app_filters = []

        if date_from is not None:
            event_filters.append(Event.start_datetime >= date_from)
            app_filters.append(Event.start_datetime >= date_from)

        if date_to is not None:
            event_filters.append(Event.start_datetime <= date_to)
            app_filters.append(Event.start_datetime <= date_to)

        events_stmt = select(
            func.count(Event.event_id).label("total_events"),
            func.sum(case((Event.start_datetime > now, 1), else_=0)).label("upcoming_events"),
            func.sum(
                case(
                    (
                        and_(
                            Event.start_datetime <= now,
                            func.coalesce(Event.end_datetime, Event.start_datetime) >= now,
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("ongoing_events"),
            func.sum(
                case(
                    (
                        func.coalesce(Event.end_datetime, Event.start_datetime) < now,
                        1,
                    ),
                    else_=0,
                )
            ).label("past_events"),
        )

        if event_filters:
            events_stmt = events_stmt.where(*event_filters)

        events_row = db.execute(events_stmt).one()

        apps_stmt = (
            select(
                func.count(EventApplication.event_id).label("total_applications"),
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
            )
            .select_from(EventApplication)
            .join(Event, Event.event_id == EventApplication.event_id)
        )

        if app_filters:
            apps_stmt = apps_stmt.where(*app_filters)

        apps_row = db.execute(apps_stmt).one()

        ts_stmt = (
            select(
                func.date(Event.start_datetime).label("day"),
                func.count(func.distinct(Event.event_id)).label("events_count"),
                func.count(EventApplication.event_id).label("applications"),
                func.sum(case((EventApplication.decision_status == DecisionStatus.accepted, 1), else_=0)).label("accepted"),
                func.sum(case((EventApplication.attendance_status == AttendanceStatus.attended, 1), else_=0)).label("attended"),
                func.sum(case((EventApplication.attendance_status == AttendanceStatus.no_show, 1), else_=0)).label("no_show"),
            )
            .select_from(Event)
            .outerjoin(EventApplication, EventApplication.event_id == Event.event_id)
            .group_by(func.date(Event.start_datetime))
            .order_by(func.date(Event.start_datetime).asc())
        )

        if event_filters:
            ts_stmt = ts_stmt.where(*event_filters)

        timeseries = db.execute(ts_stmt).all()

        top_stmt = (
            select(
                Event.event_id.label("event_id"),
                Event.title.label("title"),
                Event.start_datetime.label("start_datetime"),
                func.count(EventApplication.event_id).label("total_applications"),
                func.sum(case((EventApplication.decision_status == DecisionStatus.accepted, 1), else_=0)).label("accepted"),
                func.sum(case((EventApplication.attendance_status == AttendanceStatus.attended, 1), else_=0)).label("attended"),
                func.sum(case((EventApplication.attendance_status == AttendanceStatus.no_show, 1), else_=0)).label("no_show"),
                func.avg(EventApplication.feedback_rating).label("avg_feedback_rating"),
            )
            .select_from(Event)
            .outerjoin(EventApplication, EventApplication.event_id == Event.event_id)
            .group_by(Event.event_id, Event.title, Event.start_datetime)
            .order_by(func.sum(case((EventApplication.attendance_status == AttendanceStatus.attended, 1), else_=0)).desc(), Event.start_datetime.desc())
            .limit(top_limit)
        )

        if event_filters:
            top_stmt = top_stmt.where(*event_filters)

        top_rows = db.execute(top_stmt).all()

        total_applications = int(apps_row.total_applications or 0)
        accepted = int(apps_row.accepted or 0)
        attended = int(apps_row.attended or 0)
        no_show = int(apps_row.no_show or 0)

        return {
            "overview": {
                "total_events": int(events_row.total_events or 0),
                "upcoming_events": int(events_row.upcoming_events or 0),
                "ongoing_events": int(events_row.ongoing_events or 0),
                "past_events": int(events_row.past_events or 0),
                "total_applications": total_applications,
                "accepted": accepted,
                "rejected": int(apps_row.rejected or 0),
                "pending": int(apps_row.pending or 0),
                "waitlisted": int(apps_row.waitlisted or 0),
                "cancelled": int(apps_row.cancelled or 0),
                "attended": attended,
                "no_show": no_show,
                "unknown_attendance": int(apps_row.unknown_attendance or 0),
                "online": int(apps_row.online or 0),
                "in_person": int(apps_row.in_person or 0),
                "avg_feedback_rating": float(apps_row.avg_feedback_rating) if apps_row.avg_feedback_rating is not None else None,
                "application_acceptance_rate": (accepted / total_applications) if total_applications else 0.0,
                "attendance_rate": (attended / accepted) if accepted else 0.0,
                "no_show_rate": (no_show / accepted) if accepted else 0.0,
            },
            "timeseries": timeseries,
            "top_events": top_rows,
        }