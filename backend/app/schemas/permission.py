from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field


class PermissionOut(BaseModel):
    permission_id: int
    key: str
    description: Optional[str] = None


class PermissionCreate(BaseModel):
    key: str = Field(min_length=3, max_length=120)
    description: Optional[str] = None


class PermissionUpdate(BaseModel):
    key: Optional[str] = Field(default=None, min_length=3, max_length=120)
    description: Optional[str] = None


class PermissionListResponse(BaseModel):
    items: List[PermissionOut]
    total: int
    limit: int
    offset: int