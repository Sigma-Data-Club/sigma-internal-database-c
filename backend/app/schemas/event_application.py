from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import DecisionStatus, AttendanceStatus, AttendanceMode


class EventApplicationCreate(BaseModel):
    attendance_mode: Optional[AttendanceMode] = None


class EventApplicationDecide(BaseModel):
    decision_status: DecisionStatus


class EventApplicationAttendanceUpdate(BaseModel):
    attendance_status: AttendanceStatus
    attendance_mode: Optional[AttendanceMode] = None


class EventApplicationFeedbackSubmit(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class EventApplicationOut(BaseModel):
    event_id: int
    member_id: int
    applied_at: datetime

    decision_status: DecisionStatus
    attendance_status: AttendanceStatus
    attendance_mode: Optional[AttendanceMode] = None

    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    feedback_submitted_at: Optional[datetime] = None


class EventApplicationListResponse(BaseModel):
    items: list[EventApplicationOut]
    total: int
    limit: int
    offset: int