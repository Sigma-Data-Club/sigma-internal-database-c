from __future__ import annotations

from datetime import date, datetime
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


class EventsAnalyticsTimeseriesPoint(BaseModel):
    day: date
    events_count: int
    applications: int
    accepted: int
    attended: int
    no_show: int


class EventsTopEventRow(BaseModel):
    event_id: int
    title: str
    start_datetime: datetime
    total_applications: int
    accepted: int
    attended: int
    no_show: int
    attendance_rate: float
    no_show_rate: float
    avg_feedback_rating: Optional[float] = None


class EventsAnalyticsDashboard(BaseModel):
    total_events: int
    upcoming_events: int
    ongoing_events: int
    past_events: int

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
    application_acceptance_rate: float
    attendance_rate: float
    no_show_rate: float

    timeseries: List[EventsAnalyticsTimeseriesPoint]
    top_events: List[EventsTopEventRow]