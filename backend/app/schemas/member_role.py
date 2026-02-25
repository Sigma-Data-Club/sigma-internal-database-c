from __future__ import annotations

from typing import List
from pydantic import BaseModel

from app.schemas.role import RoleOut


class MemberRolesResponse(BaseModel):
    items: List[RoleOut]


class MemberRolesReplace(BaseModel):
    role_ids: List[int]