from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission


class RoleService:
    @staticmethod
    def list_roles(db: Session, *, limit: int, offset: int) -> tuple[list[Role], int]:
        total = db.scalar(select(func.count()).select_from(Role)) or 0
        rows = db.scalars(
            select(Role)
            .order_by(Role.role_id.asc())
            .offset(offset)
            .limit(limit)
        ).all()
        return rows, total

    @staticmethod
    def get_role(db: Session, *, role_id: int) -> Role:
        r = db.get(Role, role_id)
        if not r:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Role not found",
                    details={"role_id": role_id},
                ),
            )
        return r

    @staticmethod
    def get_role_permissions(db: Session, *, role_id: int) -> list[Permission]:
        RoleService.get_role(db, role_id=role_id)  # validates exists

        perms = db.scalars(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.permission_id)
            .where(RolePermission.role_id == role_id)
            .order_by(Permission.key.asc())
        ).all()
        return perms

    @staticmethod
    def create_role(db: Session, *, name: str) -> Role:
        r = Role(name=name.strip())
        db.add(r)
        db.commit()
        db.refresh(r)
        return r

    @staticmethod
    def update_role(db: Session, *, role_id: int, data) -> Role:
        r = RoleService.get_role(db, role_id=role_id)
        patch = data.model_dump(exclude_unset=True)

        if "name" in patch and patch["name"] is not None:
            r.name = patch["name"].strip()

        db.add(r)
        db.commit()
        db.refresh(r)
        return r

    @staticmethod
    def delete_role(db: Session, *, role_id: int) -> None:
        r = RoleService.get_role(db, role_id=role_id)
        db.delete(r)
        db.commit()

    @staticmethod
    def add_permission(db: Session, *, role_id: int, permission_id: int) -> None:
        RoleService.get_role(db, role_id=role_id)
        p = db.get(Permission, permission_id)
        if not p:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Permission not found",
                    details={"permission_id": permission_id},
                ),
            )

        rp = RolePermission(role_id=role_id, permission_id=permission_id)
        db.add(rp)
        db.commit()

    @staticmethod
    def remove_permission(db: Session, *, role_id: int, permission_id: int) -> None:
        RoleService.get_role(db, role_id=role_id)

        res = db.execute(
            delete(RolePermission).where(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id,
            )
        )
        if res.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "RolePermission link not found",
                    details={"role_id": role_id, "permission_id": permission_id},
                ),
            )
        db.commit()

    @staticmethod
    def replace_permissions(db: Session, *, role_id: int, permission_ids: list[int]) -> None:
        RoleService.get_role(db, role_id=role_id)

        # Validate all permission IDs exist
        if permission_ids:
            existing = db.scalars(
                select(Permission.permission_id).where(Permission.permission_id.in_(permission_ids))
            ).all()
            missing = sorted(set(permission_ids) - set(existing))
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_payload(
                        ErrorCode.VALIDATION_ERROR,
                        "Some permission_ids do not exist",
                        details={"missing_permission_ids": missing},
                    ),
                )

        # Replace links
        db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for pid in dict.fromkeys(permission_ids):  # stable unique
            db.add(RolePermission(role_id=role_id, permission_id=pid))
        db.commit()