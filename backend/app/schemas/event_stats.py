from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.enums import DecisionStatus, AttendanceStatus, AttendanceMode


class MemberEventApplicationRow(BaseModel):
    event_id: int
    title: str
    start_datetime: datetime
    end_datetime: Optional[datetime] = None

    applied_at: datetime
    decision_status: DecisionStatus
    attendance_status: AttendanceStatus
    attendance_mode: Optional[AttendanceMode] = None

    feedback_rating: Optional[int] = None


class MemberEventApplicationsResponse(BaseModel):
    items: List[MemberEventApplicationRow]
    total: int
    limit: int
    offset: int


class MemberEventSummary(BaseModel):
    member_id: int

    total_applied: int
    accepted: int
    rejected: int
    pending: int
    waitlisted: int
    cancelled: int

    attended: int
    no_show: int
    unknown_attendance: int

    avg_feedback_rating: Optional[float] = None


class EventAttendanceRow(BaseModel):
    member_id: int
    applied_at: datetime
    decision_status: DecisionStatus
    attendance_status: AttendanceStatus
    attendance_mode: Optional[AttendanceMode] = None

    feedback_rating: Optional[int] = None


class EventAttendanceResponse(BaseModel):
    items: List[EventAttendanceRow]
    total: int
    limit: int
    offset: int


class EventStats(BaseModel):
    event_id: int

    total_applications: int
    accepted: int
    rejected: int
    pending: int
    waitlisted: int
    cancelled: int

    attended: int
    no_show: int
    unknown_attendance: int

    online: int
    in_person: int

    avg_feedback_rating: Optional[float] = None