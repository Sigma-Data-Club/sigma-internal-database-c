from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.permissions import require_permissions
from app.schemas.role import (
    RoleOut, RoleDetail, RoleCreate, RoleUpdate, RoleListResponse, RolePermissionsReplace
)
from app.schemas.permission import PermissionOut
from app.services.role_service import RoleService


router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=RoleListResponse)
def list_roles(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.read")),
):
    items, total = RoleService.list_roles(db, limit=limit, offset=offset)
    return RoleListResponse(
        items=[RoleOut(role_id=r.role_id, name=r.name) for r in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{role_id}", response_model=RoleDetail)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.read")),
):
    r = RoleService.get_role(db, role_id=role_id)
    perms = RoleService.get_role_permissions(db, role_id=role_id)
    return RoleDetail(
        role_id=r.role_id,
        name=r.name,
        permissions=[
            PermissionOut(permission_id=p.permission_id, key=p.key, description=p.description) for p in perms
        ],
    )


@router.post("", response_model=RoleOut)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    r = RoleService.create_role(db, name=payload.name)
    return RoleOut(role_id=r.role_id, name=r.name)


@router.patch("/{role_id}", response_model=RoleOut)
def update_role(
    role_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    r = RoleService.update_role(db, role_id=role_id, data=payload)
    return RoleOut(role_id=r.role_id, name=r.name)


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    RoleService.delete_role(db, role_id=role_id)
    return {"status": "deleted"}


@router.put("/{role_id}/permissions")
def replace_role_permissions(
    role_id: int,
    payload: RolePermissionsReplace,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    RoleService.replace_permissions(db, role_id=role_id, permission_ids=payload.permission_ids)
    return {"status": "updated"}


@router.post("/{role_id}/permissions/{permission_id}")
def add_role_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    RoleService.add_permission(db, role_id=role_id, permission_id=permission_id)
    return {"status": "added"}


@router.delete("/{role_id}/permissions/{permission_id}")
def remove_role_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(require_permissions("rbac.manage")),
):
    RoleService.remove_permission(db, role_id=role_id, permission_id=permission_id)
    return {"status": "removed"}