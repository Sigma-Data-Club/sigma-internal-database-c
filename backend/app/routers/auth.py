from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    res = AuthService.login(
        db,
        email=str(payload.email),
        password=payload.password,
        device_label=payload.device_label,
        ip=ip,
        user_agent=user_agent,
    )
    return TokenResponse(
        access_token=res["access_token"],
        refresh_token=res["refresh_token"],
        expires_in=res["expires_in"],
    )