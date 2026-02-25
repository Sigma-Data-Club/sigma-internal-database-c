from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class MemberCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=60)
    academic_program_id: Optional[int] = None
    study_year: Optional[int] = Field(default=None, ge=1, le=8)

    # Если не передали — сгенерируем временный пароль и вернём его в ответе
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)

class MemberOut(BaseModel):
    member_id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str]
    academic_program_id: Optional[int]
    study_year: Optional[int]
    is_active: bool

class MemberCreateResponse(BaseModel):
    member: MemberOut
    temporary_password: Optional[str] = None

class MemberListResponse(BaseModel):
    items: List[MemberOut]
    total: int
    limit: int
    offset: int

class MemberUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=60)
    academic_program_id: Optional[int] = None
    study_year: Optional[int] = Field(default=None, ge=1, le=8)

class MemberListResponse(BaseModel):
    items: List[MemberOut]
    total: int
    limit: int
    offset: int