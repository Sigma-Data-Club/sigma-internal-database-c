from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.permissions import require_permissions
from app.models.enums import ProjectStatus
from app.schemas.project import (
    ProjectCreate,
    ProjectPut,
    ProjectPatch,
    ProjectOut,
    ProjectListOut,
    ProjectMemberCreate,
    ProjectMemberPatch,
    ProjectMemberOut,
    ProjectMemberListOut,
    ProjectSummaryOut, 
    ProjectStatsOut
)
from app.services.project_service import ProjectService


router = APIRouter(prefix="/projects", tags=["Projects"])


# ---- Projects ----

@router.get("", response_model=ProjectListOut, dependencies=[Depends(require_permissions("project.read"))])
def list_projects(
    q: str | None = Query(default=None),
    status: ProjectStatus | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = ProjectService.list_projects(db, q=q, status_=status, limit=limit, offset=offset)
    return ProjectListOut(items=items, total=total, limit=limit, offset=offset)


@router.get("/{project_id}", response_model=ProjectOut, dependencies=[Depends(require_permissions("project.read"))])
def get_project(project_id: int, db: Session = Depends(get_db)):
    return ProjectService.get_project(db, project_id=project_id)


@router.post("", response_model=ProjectOut, dependencies=[Depends(require_permissions("project.manage"))])
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    return ProjectService.create_project(
        db,
        name=payload.name,
        description=payload.description,
        status_=payload.status,
        started_at=payload.started_at,
        finished_at=payload.finished_at,
    )


@router.put("/{project_id}", response_model=ProjectOut, dependencies=[Depends(require_permissions("project.manage"))])
def put_project(project_id: int, payload: ProjectPut, db: Session = Depends(get_db)):
    return ProjectService.put_project(
        db,
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        status_=payload.status,
        started_at=payload.started_at,
        finished_at=payload.finished_at,
    )


@router.patch("/{project_id}", response_model=ProjectOut, dependencies=[Depends(require_permissions("project.manage"))])
def patch_project(project_id: int, payload: ProjectPatch, db: Session = Depends(get_db)):
    return ProjectService.patch_project(
        db,
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        status_=payload.status,
        started_at=payload.started_at,
        finished_at=payload.finished_at,
    )


@router.delete("/{project_id}", status_code=204, dependencies=[Depends(require_permissions("project.manage"))])
def delete_project(project_id: int, db: Session = Depends(get_db)):
    ProjectService.delete_project(db, project_id=project_id)
    return None


# ---- Project members ----

@router.get("/{project_id}/members", response_model=ProjectMemberListOut, dependencies=[Depends(require_permissions("project.read"))])
def list_project_members(
    project_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = ProjectService.list_project_members(db, project_id=project_id, limit=limit, offset=offset)
    return ProjectMemberListOut(items=items, total=total)


@router.get("/{project_id}/members/{member_id}", response_model=ProjectMemberOut, dependencies=[Depends(require_permissions("project.read"))])
def get_project_member(project_id: int, member_id: int, db: Session = Depends(get_db)):
    return ProjectService.get_project_member(db, project_id=project_id, member_id=member_id)


@router.post("/{project_id}/members/{member_id}", response_model=ProjectMemberOut, dependencies=[Depends(require_permissions("project.manage"))])
def add_project_member(project_id: int, member_id: int, payload: ProjectMemberCreate, db: Session = Depends(get_db)):
    return ProjectService.add_project_member(
        db,
        project_id=project_id,
        member_id=member_id,
        project_role=payload.project_role,
    )


@router.patch("/{project_id}/members/{member_id}", response_model=ProjectMemberOut, dependencies=[Depends(require_permissions("project.manage"))])
def patch_project_member(project_id: int, member_id: int, payload: ProjectMemberPatch, db: Session = Depends(get_db)):
    return ProjectService.patch_project_member(
        db,
        project_id=project_id,
        member_id=member_id,
        project_role=payload.project_role,
        left_at=payload.left_at,
    )


@router.delete("/{project_id}/members/{member_id}", status_code=204, dependencies=[Depends(require_permissions("project.manage"))])
def remove_project_member(project_id: int, member_id: int, db: Session = Depends(get_db)):
    ProjectService.remove_project_member(db, project_id=project_id, member_id=member_id)
    return None

@router.get("/active", response_model=ProjectListOut, dependencies=[Depends(require_permissions("project.read"))])
def list_active_projects(
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = ProjectService.list_active_projects(db, q=q, limit=limit, offset=offset)
    return ProjectListOut(items=items, total=total, limit=limit, offset=offset)

@router.get("/{project_id}/summary", response_model=ProjectSummaryOut, dependencies=[Depends(require_permissions("project.read"))])
def get_project_summary(project_id: int, db: Session = Depends(get_db)):
    return ProjectService.get_project_summary(db, project_id=project_id)

@router.get("/{project_id}/stats", response_model=ProjectStatsOut, dependencies=[Depends(require_permissions("project.read"))])
def get_project_stats(project_id: int, db: Session = Depends(get_db)):
    return ProjectService.get_project_stats(db, project_id=project_id)