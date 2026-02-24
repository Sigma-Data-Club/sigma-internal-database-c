import secrets
import string
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.core.security import hash_password
from app.models.member import Member
from app.models.member_auth import MemberAuth

def _generate_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

class MemberService:
    @staticmethod
    def create_member(db: Session, *, data) -> tuple[Member, str | None]:
        # unique email check
        exists = db.scalar(select(Member).where(Member.email == data.email))
        if exists:
            raise HTTPException(status_code=409, detail="Email already exists")

        plain_password = data.password or _generate_password()
        pwd_hash = hash_password(plain_password)

        member = Member(
            first_name=data.first_name,
            last_name=data.last_name,
            email=str(data.email),
            phone=data.phone,
            academic_program_id=data.academic_program_id,
            study_year=data.study_year,
        )

        member_auth = MemberAuth(password_hash=pwd_hash)
        member.auth = member_auth  # 1:1

        db.add(member)
        db.commit()
        db.refresh(member)

        # Если пароль пришёл в запросе — temporary_password не возвращаем
        temp = None if data.password else plain_password
        return member, temp