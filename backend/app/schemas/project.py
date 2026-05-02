from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProjectStatus, ProjectApplicationStatus


class ProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=10_000)
    status: ProjectStatus = ProjectStatus.planned
    started_at: Optional[date] = None
    finished_at: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectPut(ProjectBase):
    pass


class ProjectPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=10_000)
    status: Optional[ProjectStatus] = None
    started_at: Optional[date] = None
    finished_at: Optional[date] = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    project_id: int


class ProjectListOut(BaseModel):
    items: list[ProjectOut]
    total: int
    limit: int
    offset: int


class ProjectMemberBase(BaseModel):
    project_role: str = Field(min_length=1, max_length=60)
    left_at: Optional[datetime] = None


class ProjectMemberCreate(ProjectMemberBase):
    pass


class ProjectMemberPatch(BaseModel):
    project_role: Optional[str] = Field(default=None, min_length=1, max_length=60)
    left_at: Optional[datetime] = None


class ProjectMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
    member_id: int
    project_role: str
    joined_at: datetime
    left_at: Optional[datetime] = None


class ProjectMemberListOut(BaseModel):
    items: list[ProjectMemberOut]
    total: int


class ProjectStatsOut(BaseModel):
    members_total: int
    members_active: int
    applications_pending: int

    finance_income_total: Optional[int] = None
    finance_expense_total: Optional[int] = None
    finance_balance: Optional[int] = None


class ProjectSummaryOut(BaseModel):
    project: ProjectOut
    stats: ProjectStatsOut


class ProjectApplicationCreate(BaseModel):
    desired_role: str = Field(min_length=1, max_length=60)
    application_text: str = Field(min_length=1, max_length=5000)


class ProjectApplicationDecision(BaseModel):
    status: ProjectApplicationStatus
    manager_note: Optional[str] = Field(default=None, max_length=5000)


class ProjectApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    application_id: int
    project_id: int
    member_id: int
    desired_role: str
    application_text: str
    status: ProjectApplicationStatus
    manager_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_member_id: Optional[int] = None


class ProjectApplicationListOut(BaseModel):
    items: list[ProjectApplicationOut]
    total: int
    limit: int
    offset: int