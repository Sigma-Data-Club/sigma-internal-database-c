from __future__ import annotations

import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.core.security import hash_password
from app.models.role import Role
from app.models.member import Member
from app.models.member_auth import MemberAuth
from app.models.member_role import MemberRole
from sqlalchemy import select, func

def _generate_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class MemberService:
    @staticmethod
    def create_member(db: Session, *, data) -> tuple[Member, str | None]:
        # Normalize email
        email = str(data.email).strip().lower()

        # Prevent common FK bug (academic_program_id=0)
        if data.academic_program_id is not None and data.academic_program_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "academic_program_id must be null or a positive integer ID",
                    details={"field": "academic_program_id", "value": data.academic_program_id},
                ),
            )

        # Friendly uniqueness check (still keep global IntegrityError handler for race)
        exists = db.scalar(select(Member).where(Member.email == email))
        if exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.DB_UNIQUE_VIOLATION,
                    "Email already exists",
                    details={"field": "email"},
                ),
            )

        plain_password = data.password or _generate_password()
        pwd_hash = hash_password(plain_password)

        member = Member(
            first_name=data.first_name,
            last_name=data.last_name,
            email=email,
            phone=data.phone,
            academic_program_id=data.academic_program_id,
            study_year=data.study_year,
        )

        member_auth = MemberAuth(password_hash=pwd_hash)
        member.auth = member_auth  # relies on 1:1 relationship

        db.add(member)
        db.commit()
        db.refresh(member)

        temp = None if data.password else plain_password
        return member, temp
    
    @staticmethod
    def list_members(db: Session, *, limit: int, offset: int) -> tuple[list[Member], int]:
        total = db.scalar(select(func.count()).select_from(Member)) or 0

        rows = db.scalars(
            select(Member)
            .order_by(Member.member_id.asc())
            .offset(offset)
            .limit(limit)
        ).all()

        return rows, total
    
    @staticmethod
    def get_member_by_id(db: Session, *, member_id: int) -> Member:
        member = db.get(Member, member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Member not found",
                    details={"member_id": member_id},
                ),
            )
        return member

    @staticmethod
    def update_member(db: Session, *, member_id: int, data) -> Member:
        member = MemberService.get_member_by_id(db, member_id=member_id)

        patch = data.model_dump(exclude_unset=True)

        # academic_program_id sanity
        if "academic_program_id" in patch and patch["academic_program_id"] is not None and patch["academic_program_id"] <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "academic_program_id must be null or a positive integer ID",
                    details={"field": "academic_program_id", "value": patch["academic_program_id"]},
                ),
            )

        # Normalize email + uniqueness check (if email is allowed to be updated)
        if "email" in patch and patch["email"] is not None:
            new_email = str(patch["email"]).strip().lower()
            if new_email != member.email:
                exists = db.scalar(select(Member).where(Member.email == new_email))
                if exists:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=error_payload(
                            ErrorCode.DB_UNIQUE_VIOLATION,
                            "Email already exists",
                            details={"field": "email"},
                        ),
                    )
                member.email = new_email

            # remove so we don't set twice
            patch.pop("email", None)

        # Apply other fields
        for k, v in patch.items():
            setattr(member, k, v)

        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def set_member_active(db: Session, *, member_id: int, is_active: bool) -> Member:
        member = MemberService.get_member_by_id(db, member_id=member_id)
        member.is_active = is_active
        db.add(member)
        db.commit()
        db.refresh(member)
        return member
    
    @staticmethod
    def list_member_roles(db: Session, *, member_id: int) -> list[Role]:
        # ensure member exists
        MemberService.get_member_by_id(db, member_id=member_id)

        roles = db.scalars(
            select(Role)
            .join(MemberRole, MemberRole.role_id == Role.role_id)
            .where(MemberRole.member_id == member_id)
            .order_by(Role.name.asc())
        ).all()
        return roles

    @staticmethod
    def add_member_role(db: Session, *, member_id: int, role_id: int) -> None:
        MemberService.get_member_by_id(db, member_id=member_id)

        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Role not found",
                    details={"role_id": role_id},
                ),
            )

        link = MemberRole(member_id=member_id, role_id=role_id)
        db.add(link)
        db.commit()
        # если уже было — сработает UNIQUE/PK и отловится вашим IntegrityError handler

    @staticmethod
    def remove_member_role(db: Session, *, member_id: int, role_id: int) -> None:
        MemberService.get_member_by_id(db, member_id=member_id)

        res = db.execute(
            delete(MemberRole).where(
                MemberRole.member_id == member_id,
                MemberRole.role_id == role_id,
            )
        )
        if res.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "MemberRole link not found",
                    details={"member_id": member_id, "role_id": role_id},
                ),
            )
        db.commit()

    @staticmethod
    def replace_member_roles(db: Session, *, member_id: int, role_ids: list[int]) -> None:
        MemberService.get_member_by_id(db, member_id=member_id)

        # validate all role_ids exist
        if role_ids:
            existing = db.scalars(select(Role.role_id).where(Role.role_id.in_(role_ids))).all()
            missing = sorted(set(role_ids) - set(existing))
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_payload(
                        ErrorCode.VALIDATION_ERROR,
                        "Some role_ids do not exist",
                        details={"missing_role_ids": missing},
                    ),
                )

        # replace links
        db.execute(delete(MemberRole).where(MemberRole.member_id == member_id))
        for rid in dict.fromkeys(role_ids):  # unique, stable order
            db.add(MemberRole(member_id=member_id, role_id=rid))
        db.commit()