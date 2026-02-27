from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.permissions import require_permissions
from app.models.member import Member as MemberModel

from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventOut,
    EventListResponse,
)
from app.schemas.event_application import (
    EventApplicationCreate,
    EventApplicationDecide,
    EventApplicationAttendanceUpdate,
    EventApplicationOut,
    EventApplicationListResponse,
    EventApplicationFeedbackSubmit,
)
from app.schemas.event_stats import (
    EventAttendanceResponse,
    EventAttendanceRow,
    EventStats,
)

from app.services.event_service import EventService
from app.services.event_application_service import EventApplicationService
from app.services.event_stats_service import EventStatsService


router = APIRouter(prefix="/events", tags=["events"])


def _to_out(ev) -> EventOut:
    return EventOut(
        event_id=ev.event_id,
        title=ev.title,
        start_datetime=ev.start_datetime,
        end_datetime=ev.end_datetime,
        speaker_name=ev.speaker_name,
        topic=ev.topic,
        created_by_member_id=ev.created_by_member_id,
        created_at=ev.created_at,
    )


@router.get("", response_model=EventListResponse)
def list_events(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    items, total = EventService.list_events(db, limit=limit, offset=offset)
    return EventListResponse(
        items=[_to_out(ev) for ev in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    ev = EventService.get_event_by_id(db, event_id=event_id)
    return _to_out(ev)


@router.post("", response_model=EventOut)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.create")),
):
    ev = EventService.create_event(
        db,
        title=payload.title,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        speaker_name=payload.speaker_name,
        topic=payload.topic,
        created_by_member_id=_auth.member_id,
    )
    return _to_out(ev)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.update")),
):
    ev = EventService.update_event(db, event_id=event_id, data=payload)
    return _to_out(ev)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.delete")),
):
    EventService.delete_event(db, event_id=event_id)
    return {"status": "deleted"}


def _app_to_out(a) -> EventApplicationOut:
    return EventApplicationOut(
        event_id=a.event_id,
        member_id=a.member_id,
        applied_at=a.applied_at,
        decision_status=a.decision_status,
        attendance_status=a.attendance_status,
        attendance_mode=a.attendance_mode,
        feedback_rating=getattr(a, "feedback_rating", None),
        feedback_comment=getattr(a, "feedback_comment", None),
        feedback_submitted_at=getattr(a, "feedback_submitted_at", None),
    )


@router.post("/{event_id}/applications", response_model=EventApplicationOut)
def apply_to_event(
    event_id: int,
    payload: EventApplicationCreate,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    a = EventApplicationService.apply(
        db,
        event_id=event_id,
        member_id=_auth.member_id,
        attendance_mode=payload.attendance_mode,
    )
    return _app_to_out(a)


@router.get("/{event_id}/applications/me", response_model=EventApplicationOut)
def get_my_application(
    event_id: int,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    a = EventApplicationService.get_application(db, event_id=event_id, member_id=_auth.member_id)
    return _app_to_out(a)


@router.post("/{event_id}/applications/me/feedback", response_model=EventApplicationOut)
def submit_my_feedback(
    event_id: int,
    payload: EventApplicationFeedbackSubmit,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    a = EventApplicationService.submit_feedback(
        db,
        event_id=event_id,
        member_id=_auth.member_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    return _app_to_out(a)


@router.get("/{event_id}/applications", response_model=EventApplicationListResponse)
def list_event_applications(
    event_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.decide")),
):
    items, total = EventApplicationService.list_event_applications(db, event_id=event_id, limit=limit, offset=offset)
    return EventApplicationListResponse(
        items=[_app_to_out(a) for a in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/{event_id}/applications/{member_id}/decide", response_model=EventApplicationOut)
def decide_event_application(
    event_id: int,
    member_id: int,
    payload: EventApplicationDecide,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.decide")),
):
    a = EventApplicationService.decide(
        db,
        event_id=event_id,
        member_id=member_id,
        decision_status=payload.decision_status,
    )
    return _app_to_out(a)


@router.post("/{event_id}/applications/{member_id}/attendance", response_model=EventApplicationOut)
def update_event_attendance(
    event_id: int,
    member_id: int,
    payload: EventApplicationAttendanceUpdate,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.update")),
):
    a = EventApplicationService.update_attendance(
        db,
        event_id=event_id,
        member_id=member_id,
        attendance_status=payload.attendance_status,
        attendance_mode=payload.attendance_mode,
    )
    return _app_to_out(a)


@router.get("/{event_id}/attendance", response_model=EventAttendanceResponse)
def event_attendance(
    event_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    apps, total = EventStatsService.list_event_attendance(db, event_id=event_id, limit=limit, offset=offset)
    return EventAttendanceResponse(
        items=[
            EventAttendanceRow(
                member_id=a.member_id,
                applied_at=a.applied_at,
                decision_status=a.decision_status,
                attendance_status=a.attendance_status,
                attendance_mode=a.attendance_mode,
                feedback_rating=getattr(a, "feedback_rating", None),
            )
            for a in apps
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{event_id}/stats", response_model=EventStats)
def get_event_stats(
    event_id: int,
    db: Session = Depends(get_db),
    _auth: MemberModel = Depends(require_permissions("event.read")),
):
    row = EventStatsService.event_stats(db, event_id=event_id)
    return EventStats(
        event_id=event_id,
        total_applications=int(row.total_applications or 0),
        accepted=int(row.accepted or 0),
        rejected=int(row.rejected or 0),
        pending=int(row.pending or 0),
        waitlisted=int(row.waitlisted or 0),
        cancelled=int(row.cancelled or 0),
        attended=int(row.attended or 0),
        no_show=int(row.no_show or 0),
        unknown_attendance=int(row.unknown_attendance or 0),
        online=int(row.online or 0),
        in_person=int(row.in_person or 0),
        avg_feedback_rating=float(row.avg_feedback_rating) if row.avg_feedback_rating is not None else None,
    )