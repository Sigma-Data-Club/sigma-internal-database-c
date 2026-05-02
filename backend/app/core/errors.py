from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel


class ErrorCode(str, Enum):
    # Auth
    AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN"
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_SESSION_NOT_FOUND = "AUTH_SESSION_NOT_FOUND"
    AUTH_SESSION_REVOKED = "AUTH_SESSION_REVOKED"
    AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED"
    AUTH_INACTIVE_MEMBER = "AUTH_INACTIVE_MEMBER"

    # Permissions
    PERMISSION_DENIED = "PERMISSION_DENIED"

    # Admin key
    ADMIN_KEY_MISSING = "ADMIN_KEY_MISSING"
    ADMIN_KEY_INVALID = "ADMIN_KEY_INVALID"
    ADMIN_KEY_NOT_CONFIGURED = "ADMIN_KEY_NOT_CONFIGURED"

    # Validation / request
    VALIDATION_ERROR = "VALIDATION_ERROR"

    # DB
    DB_UNIQUE_VIOLATION = "DB_UNIQUE_VIOLATION"
    DB_FK_VIOLATION = "DB_FK_VIOLATION"
    DB_INTEGRITY_ERROR = "DB_INTEGRITY_ERROR"

    # Generic
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    details: dict[str, Any] = {}


class ErrorResponse(BaseModel):
    error: ErrorBody


def error_payload(code: ErrorCode, message: str, details: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    return ErrorResponse(error=ErrorBody(code=code, message=message, details=details or {})).model_dump()