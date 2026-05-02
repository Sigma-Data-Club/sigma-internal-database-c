from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.permission import PermissionOut


class RoleOut(BaseModel):
    role_id: int
    name: str


class RoleDetail(RoleOut):
    permissions: List[PermissionOut] = []


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)


class RoleListResponse(BaseModel):
    items: List[RoleOut]
    total: int
    limit: int
    offset: int


class RolePermissionsReplace(BaseModel):
    permission_ids: List[int]