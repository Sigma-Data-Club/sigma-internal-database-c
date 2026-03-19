from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=512)
    device_label: Optional[str] = Field(default=None, max_length=120)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    
class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=2048)

class StatusResponse(BaseModel):
    status: str = "ok"

class LogoutAllResponse(BaseModel):
    status: str = "ok"
    revoked_sessions: int


class AuthAccessRoleOut(BaseModel):
    role_id: int
    name: str


class AuthAccessProfileResponse(BaseModel):
    member_id: int
    email: EmailStr
    is_active: bool
    roles: List[AuthAccessRoleOut]
    permissions: List[str]