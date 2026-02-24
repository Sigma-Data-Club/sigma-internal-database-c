from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import os
from passlib.context import CryptContext
from jose import jwt

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return _pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(password, password_hash)

def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not set")
    return secret

def _jwt_alg() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")

def create_access_token(*, member_id: int, session_id: str) -> tuple[str, datetime]:
    minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=minutes)
    payload = {
        "sub": str(member_id),
        "sid": str(session_id),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "type": "access",
    }
    token = jwt.encode(payload, _jwt_secret(), algorithm=_jwt_alg())
    return token, exp

def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)

def hash_refresh_token(token: str) -> str:
    # fast + OK for token hashing; if you want stronger, use HMAC with secret
    return hashlib.sha256(token.encode("utf-8")).hexdigest()