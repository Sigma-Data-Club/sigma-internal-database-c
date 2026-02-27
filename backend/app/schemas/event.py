from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class EventOut(BaseModel):
    event_id: int
    title: str
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    speaker_name: Optional[str] = None
    topic: Optional[str] = None
    created_by_member_id: Optional[int] = None
    created_at: datetime


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    speaker_name: Optional[str] = Field(default=None, max_length=200)
    topic: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    speaker_name: Optional[str] = Field(default=None, max_length=200)
    topic: Optional[str] = None


class EventListResponse(BaseModel):
    items: List[EventOut]
    total: int
    limit: int
    offset: int