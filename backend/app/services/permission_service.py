from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.models.permission import Permission


class PermissionService:
    @staticmethod
    def list_permissions(db: Session, *, limit: int, offset: int) -> tuple[list[Permission], int]:
        total = db.scalar(select(func.count()).select_from(Permission)) or 0
        rows = db.scalars(
            select(Permission)
            .order_by(Permission.permission_id.asc())
            .offset(offset)
            .limit(limit)
        ).all()
        return rows, total

    @staticmethod
    def get_permission(db: Session, *, permission_id: int) -> Permission:
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
        return p

    @staticmethod
    def create_permission(db: Session, *, key: str, description: str | None) -> Permission:
        p = Permission(key=key.strip(), description=description)
        db.add(p)
        db.commit()
        db.refresh(p)
        return p

    @staticmethod
    def update_permission(db: Session, *, permission_id: int, data) -> Permission:
        p = PermissionService.get_permission(db, permission_id=permission_id)
        patch = data.model_dump(exclude_unset=True)

        if "key" in patch and patch["key"] is not None:
            p.key = patch["key"].strip()

        if "description" in patch:
            p.description = patch["description"]

        db.add(p)
        db.commit()
        db.refresh(p)
        return p

    @staticmethod
    def delete_permission(db: Session, *, permission_id: int) -> None:
        p = PermissionService.get_permission(db, permission_id=permission_id)
        db.delete(p)
        db.commit()