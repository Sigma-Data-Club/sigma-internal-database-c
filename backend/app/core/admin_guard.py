from __future__ import annotations

import os
from fastapi import Header, HTTPException

from app.core.errors import ErrorCode, error_payload


def require_admin_key(x_admin_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("ADMIN_API_KEY")
    if not expected:
        raise HTTPException(
            status_code=500,
            detail=error_payload(ErrorCode.ADMIN_KEY_NOT_CONFIGURED, "ADMIN_API_KEY is not set"),
        )

    if x_admin_key is None:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.ADMIN_KEY_MISSING, "Missing admin key"),
        )

    if x_admin_key != expected:
        raise HTTPException(
            status_code=401,
            detail=error_payload(ErrorCode.ADMIN_KEY_INVALID, "Invalid admin key"),
        )