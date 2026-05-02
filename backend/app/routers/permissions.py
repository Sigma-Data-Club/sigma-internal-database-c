from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.permissions import require_permissions
from app.schemas.permission import (
    PermissionOut, PermissionCreate, PermissionUpdate, PermissionListResponse
)
from app.services.permission_service import PermissionService


router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=PermissionListResponse)
def list_permissions(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.read")),
):
    items, total = PermissionService.list_permissions(db, limit=limit, offset=offset)
    return PermissionListResponse(
        items=[PermissionOut(permission_id=p.permission_id, key=p.key, description=p.description) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=PermissionOut)
def create_permission(
    payload: PermissionCreate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    p = PermissionService.create_permission(db, key=payload.key, description=payload.description)
    return PermissionOut(permission_id=p.permission_id, key=p.key, description=p.description)


@router.patch("/{permission_id}", response_model=PermissionOut)
def update_permission(
    permission_id: int,
    payload: PermissionUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    p = PermissionService.update_permission(db, permission_id=permission_id, data=payload)
    return PermissionOut(permission_id=p.permission_id, key=p.key, description=p.description)


@router.delete("/{permission_id}")
def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    PermissionService.delete_permission(db, permission_id=permission_id)
    return {"status": "deleted"}