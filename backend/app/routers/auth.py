from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.auth_dependencies import get_current_session
from app.models.auth_session import AuthSession
from app.core.dependencies import get_db
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    StatusResponse,
    LogoutAllResponse,
)
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

@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    res = AuthService.refresh(db, refresh_token=payload.refresh_token)
    return TokenResponse(
        access_token=res["access_token"],
        refresh_token=res["refresh_token"],
        expires_in=res["expires_in"],
    )

@router.post("/logout", response_model=StatusResponse)
def logout(
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    AuthService.logout(db, session_id=str(session.session_id))
    return StatusResponse(status="ok")


@router.post("/logout_all", response_model=LogoutAllResponse)
def logout_all(
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    revoked = AuthService.logout_all(db, member_id=session.member_id)
    return LogoutAllResponse(status="ok", revoked_sessions=revoked)