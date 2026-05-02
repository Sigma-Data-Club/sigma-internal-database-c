from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.permissions import require_admin_or_permissions, require_permissions
from app.services.member_service import MemberService
from app.core.auth_dependencies import require_active_member
from app.models.member import Member as MemberModel
from app.schemas.member import (
    MemberCreate, MemberCreateResponse, MemberOut,
    MemberUpdate, MemberListResponse
)
from app.schemas.role import RoleOut
from app.schemas.member_role import MemberRolesResponse, MemberRolesReplace

from app.schemas.event_stats import MemberEventApplicationsResponse, MemberEventSummary, MemberEventApplicationRow
from app.services.event_stats_service import EventStatsService
from app.models.enums import DecisionStatus


router = APIRouter(prefix="/members", tags=["members"])

@router.get("", response_model=MemberListResponse)
def list_members(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.read")),
):
    members, total = MemberService.list_members(db, limit=limit, offset=offset)
    return MemberListResponse(
        items=[MemberOut(
            member_id=m.member_id,
            first_name=m.first_name,
            last_name=m.last_name,
            email=m.email,
            phone=m.phone,
            academic_program_id=m.academic_program_id,
            study_year=m.study_year,
            is_active=m.is_active,
        ) for m in members],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/me", response_model=MemberOut)
def get_me(current: MemberModel = Depends(require_active_member)):
    return MemberOut(
        member_id=current.member_id,
        first_name=current.first_name,
        last_name=current.last_name,
        email=current.email,
        phone=current.phone,
        academic_program_id=current.academic_program_id,
        study_year=current.study_year,
        is_active=current.is_active,
    )


@router.get("/{member_id}", response_model=MemberOut)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.read")),
):
    m = MemberService.get_member_by_id(db, member_id=member_id)
    return MemberOut(
        member_id=m.member_id,
        first_name=m.first_name,
        last_name=m.last_name,
        email=m.email,
        phone=m.phone,
        academic_program_id=m.academic_program_id,
        study_year=m.study_year,
        is_active=m.is_active,
    )


@router.patch("/{member_id}", response_model=MemberOut)
def update_member(
    member_id: int,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.update")),
):
    m = MemberService.update_member(db, member_id=member_id, data=payload)
    return MemberOut(
        member_id=m.member_id,
        first_name=m.first_name,
        last_name=m.last_name,
        email=m.email,
        phone=m.phone,
        academic_program_id=m.academic_program_id,
        study_year=m.study_year,
        is_active=m.is_active,
    )


@router.post("/{member_id}/activate", response_model=MemberOut)
def activate_member(
    member_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.update")),
):
    m = MemberService.set_member_active(db, member_id=member_id, is_active=True)
    return MemberOut(
        member_id=m.member_id,
        first_name=m.first_name,
        last_name=m.last_name,
        email=m.email,
        phone=m.phone,
        academic_program_id=m.academic_program_id,
        study_year=m.study_year,
        is_active=m.is_active,
    )


@router.post("/{member_id}/deactivate", response_model=MemberOut)
def deactivate_member(
    member_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.update")),
):
    m = MemberService.set_member_active(db, member_id=member_id, is_active=False)
    return MemberOut(
        member_id=m.member_id,
        first_name=m.first_name,
        last_name=m.last_name,
        email=m.email,
        phone=m.phone,
        academic_program_id=m.academic_program_id,
        study_year=m.study_year,
        is_active=m.is_active,
    )


@router.post("", response_model=MemberCreateResponse)
def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    _auth=Depends(require_admin_or_permissions("member.create")),
):
    member, temp_password = MemberService.create_member(db, data=payload)
    return MemberCreateResponse(
        member=MemberOut(
            member_id=member.member_id,
            first_name=member.first_name,
            last_name=member.last_name,
            email=member.email,
            phone=member.phone,
            academic_program_id=member.academic_program_id,
            study_year=member.study_year,
            is_active=member.is_active,
        ),
        temporary_password=temp_password,
    )

@router.get("/{member_id}/roles", response_model=MemberRolesResponse)
def get_member_roles(
    member_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    roles = MemberService.list_member_roles(db, member_id=member_id)
    return MemberRolesResponse(
        items=[RoleOut(role_id=r.role_id, name=r.name) for r in roles]
    )


@router.put("/{member_id}/roles")
def replace_member_roles(
    member_id: int,
    payload: MemberRolesReplace,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    MemberService.replace_member_roles(db, member_id=member_id, role_ids=payload.role_ids)
    return {"status": "updated"}


@router.post("/{member_id}/roles/{role_id}")
def add_member_role(
    member_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    MemberService.add_member_role(db, member_id=member_id, role_id=role_id)
    return {"status": "added"}


@router.delete("/{member_id}/roles/{role_id}")
def remove_member_role(
    member_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    MemberService.remove_member_role(db, member_id=member_id, role_id=role_id)
    return {"status": "removed"}

@router.get("/{member_id}/events", response_model=MemberEventApplicationsResponse)
def list_member_events(
    member_id: int,
    attended_only: bool = Query(default=False),
    decision_status: DecisionStatus | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.read")),
):
    rows, total = EventStatsService.list_member_events(
        db,
        member_id=member_id,
        limit=limit,
        offset=offset,
        attended_only=attended_only,
        decision_status=decision_status,
    )

    items = []
    for app, ev in rows:
        items.append(MemberEventApplicationRow(
            event_id=ev.event_id,
            title=ev.title,
            start_datetime=ev.start_datetime,
            end_datetime=ev.end_datetime,
            applied_at=app.applied_at,
            decision_status=app.decision_status,
            attendance_status=app.attendance_status,
            attendance_mode=app.attendance_mode,
            feedback_rating=getattr(app, "feedback_rating", None),
        ))

    return MemberEventApplicationsResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{member_id}/events/summary", response_model=MemberEventSummary)
def member_events_summary(
    member_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("member.read")),
):
    row = EventStatsService.member_summary(db, member_id=member_id)

    return MemberEventSummary(
    member_id=member_id,
    total_applied=int(row.total_applied or 0),

    # Decision breakdown (required by schema)
    accepted=int(row.accepted or 0),
    rejected=int(row.rejected or 0),
    pending=int(row.pending or 0),
    waitlisted=int(row.waitlisted or 0),
    cancelled=int(row.cancelled or 0),

    # Attendance breakdown (required by schema)
    attended=int(row.attended or 0),
    no_show=int(row.no_show or 0),
    unknown_attendance=int(row.unknown_attendance or 0),

    # Optional (if schema has it; if not, remove these two)
    online=int(getattr(row, "online", 0) or 0),
    in_person=int(getattr(row, "in_person", 0) or 0),

    avg_feedback_rating=float(row.avg_feedback_rating) if row.avg_feedback_rating is not None else None,
)