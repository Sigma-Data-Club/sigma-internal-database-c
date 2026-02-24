from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.admin_guard import require_admin_key
from app.schemas.member import MemberCreate, MemberCreateResponse, MemberOut
from app.services.member_service import MemberService

router = APIRouter(prefix="/members", tags=["members"])

@router.post("", response_model=MemberCreateResponse, dependencies=[Depends(require_admin_key)])
def create_member(payload: MemberCreate, db: Session = Depends(get_db)):
    member, temp_password = MemberService.create_member(db, data=payload)
    return MemberCreateResponse(
        member=MemberOut(
            member_id=member.member_id,
            first_name=member.first_name,
            last_name=member.last_name,
            email=member.email,
            phone=member.phone,
            academic_program_id=member.academic_program_id,
            study_year=member.study_year,
            is_active=member.is_active,
        ),
        temporary_password=temp_password,
    )