from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from app.models.member_role import MemberRole
from app.models.member import Member
from app.models.member_auth import MemberAuth
from app.models.auth_session import AuthSession
from app.core.permissions import get_member_permission_keys
from app.core.errors import ErrorCode, error_payload
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
)


class AuthService:
    @staticmethod
    def _utcnow() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _refresh_ttl_days() -> int:
        return int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "60"))

    @staticmethod
    def _expires_in_seconds(exp: datetime, now: datetime) -> int:
        sec = int((exp - now).total_seconds())
        return max(sec, 0)

    @staticmethod
    def login(
        db: Session,
        *,
        email: str,
        password: str,
        device_label: str | None = None,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        member = db.scalar(select(Member).where(Member.email == email))
        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials"),
            )

        if hasattr(member, "is_active") and not member.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_payload(ErrorCode.AUTH_INACTIVE_MEMBER, "Inactive member"),
            )

        auth = db.scalar(select(MemberAuth).where(MemberAuth.member_id == member.member_id))
        if not auth or not getattr(auth, "password_hash", None):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials"),
            )

        if not verify_password(password, auth.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials"),
            )

        refresh = create_refresh_token()
        refresh_hash = hash_refresh_token(refresh)

        now = AuthService._utcnow()
        days = AuthService._refresh_ttl_days()

        session = AuthSession(
            session_id=uuid.uuid4(),
            member_id=member.member_id,
            refresh_token_hash=refresh_hash,
            created_at=now,
            expires_at=now + timedelta(days=days),
            revoked_at=None,
            last_used_at=now,
            ip=ip,
            user_agent=user_agent,
            device_label=device_label,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        access, exp = create_access_token(member_id=member.member_id, session_id=str(session.session_id))
        expires_in = AuthService._expires_in_seconds(exp, now)

        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "expires_in": expires_in,
        }

    @staticmethod
    def refresh(
        db: Session,
        *,
        refresh_token: str,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        now = AuthService._utcnow()
        incoming_hash = hash_refresh_token(refresh_token)

        session = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == incoming_hash))
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Invalid refresh token"),
            )

        if session.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_SESSION_REVOKED, "Session revoked"),
            )

        if session.expires_at is not None and session.expires_at <= now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_SESSION_EXPIRED, "Session expired"),
            )

        new_refresh = create_refresh_token()
        session.refresh_token_hash = hash_refresh_token(new_refresh)
        session.last_used_at = now

        if hasattr(session, "ip"):
            session.ip = ip
        if hasattr(session, "user_agent"):
            session.user_agent = user_agent

        db.add(session)
        db.commit()
        db.refresh(session)

        access, exp = create_access_token(member_id=session.member_id, session_id=str(session.session_id))
        expires_in = AuthService._expires_in_seconds(exp, now)

        return {
            "access_token": access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": expires_in,
        }

    @staticmethod
    def logout(db: Session, *, session_id: str) -> None:
        now = AuthService._utcnow()

        session = db.get(AuthSession, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_SESSION_NOT_FOUND, "Session not found"),
            )

        if session.revoked_at is None:
            session.revoked_at = now
            session.last_used_at = now
            db.add(session)
            db.commit()

    @staticmethod
    def logout_all(db: Session, *, member_id: int) -> int:
        now = AuthService._utcnow()

        sessions = db.scalars(
            select(AuthSession).where(
                AuthSession.member_id == member_id,
                AuthSession.revoked_at.is_(None),
            )
        ).all()

        for s in sessions:
            s.revoked_at = now
            s.last_used_at = now
            db.add(s)

        db.commit()
        return len(sessions)
    
    @staticmethod
    def get_my_access_profile(db: Session, *, member_id: int) -> dict:
        member = db.scalar(
            select(Member)
            .options(
                selectinload(Member.roles).selectinload(MemberRole.role)
            )
            .where(Member.member_id == member_id)
        )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_payload(ErrorCode.AUTH_INVALID_TOKEN, "Member not found"),
            )

        permissions = sorted(get_member_permission_keys(db, member.member_id))

        roles = []
        for member_role in member.roles:
            role = member_role.role
            if role is None:
                continue
            roles.append({
                "role_id": role.role_id,
                "name": role.name,
            })

        roles.sort(key=lambda r: r["name"].lower())

        return {
            "member_id": member.member_id,
            "email": member.email,
            "is_active": bool(member.is_active),
            "roles": roles,
            "permissions": permissions,
        }