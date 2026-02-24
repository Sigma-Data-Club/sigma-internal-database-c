from datetime import datetime, timedelta, timezone
import os
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
import uuid

from app.models.member import Member
from app.models.member_auth import MemberAuth
from app.models.auth_session import AuthSession
from app.core.security import verify_password, create_access_token, create_refresh_token, hash_refresh_token, verify_refresh_token

class AuthService:
    @staticmethod
    def login(db: Session, *, email: str, password: str, device_label: str | None, ip: str | None, user_agent: str | None):
        member = db.scalar(select(Member).where(Member.email == email))
        if not member:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        auth = db.scalar(select(MemberAuth).where(MemberAuth.member_id == member.member_id))
        if not auth:
            raise HTTPException(status_code=401, detail="Account has no credentials")

        if not verify_password(password, auth.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        refresh = create_refresh_token()
        refresh_hash = hash_refresh_token(refresh)

        days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "60"))
        now = datetime.now(timezone.utc)

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
        expires_in = int((exp - now).total_seconds())

        return {
            "access_token": access,
            "refresh_token": refresh,
            "expires_in": expires_in,
        }
    
    @staticmethod
    def refresh(db: Session, *, refresh_token: str):
        now = datetime.now(timezone.utc)
        incoming_hash = hash_refresh_token(refresh_token)

        session = db.scalar(
            select(AuthSession).where(AuthSession.refresh_token_hash == incoming_hash)
        )
        if not session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        if session.revoked_at is not None:
            raise HTTPException(status_code=401, detail="Session revoked")

        if session.expires_at <= now:
            raise HTTPException(status_code=401, detail="Session expired")

        new_refresh = create_refresh_token()
        session.refresh_token_hash = hash_refresh_token(new_refresh)
        session.last_used_at = now

        db.add(session)
        db.commit()
        db.refresh(session)

        access, exp = create_access_token(member_id=session.member_id, session_id=str(session.session_id))
        expires_in = int((exp - now).total_seconds())

        return {
            "access_token": access,
            "refresh_token": new_refresh,
            "expires_in": expires_in,
        }
    
    @staticmethod
    def logout(db: Session, *, session_id: str) -> None:
        now = datetime.now(timezone.utc)

        session = db.get(AuthSession, session_id)
        if not session:
            raise HTTPException(status_code=401, detail="Session not found")

        if session.revoked_at is None:
            session.revoked_at = now
            session.last_used_at = now
            db.add(session)
            db.commit()

    @staticmethod
    def logout_all(db: Session, *, member_id: int) -> int:
        now = datetime.now(timezone.utc)

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