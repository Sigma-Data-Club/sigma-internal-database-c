from __future__ import annotations

import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.core.security import hash_password
from app.models.member import Member
from app.models.member_auth import MemberAuth


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