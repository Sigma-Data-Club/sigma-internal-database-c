from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError

from app.core.errors import ErrorCode, error_payload


def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail

    # Если detail уже в контракте — не трогаем.
    if isinstance(detail, dict) and "error" in detail:
        payload = detail
    else:
        # Фолбэк для старого кода, где detail="строка"
        payload = error_payload(
            code=ErrorCode.INTERNAL_ERROR if exc.status_code >= 500 else ErrorCode.VALIDATION_ERROR,
            message=str(detail),
            details={},
        )

    return JSONResponse(status_code=exc.status_code, content=payload)


def request_validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    payload = error_payload(
        code=ErrorCode.VALIDATION_ERROR,
        message="Validation error",
        details={"errors": exc.errors()},
    )
    return JSONResponse(status_code=422, content=payload)


def integrity_error_handler(_: Request, exc: IntegrityError) -> JSONResponse:
    pgcode = getattr(getattr(exc, "orig", None), "pgcode", None)

    if pgcode == "23505":
        code = ErrorCode.DB_UNIQUE_VIOLATION
        status = 409
        msg = "Unique constraint violation"
    elif pgcode == "23503":
        code = ErrorCode.DB_FK_VIOLATION
        status = 400
        msg = "Foreign key violation"
    else:
        code = ErrorCode.DB_INTEGRITY_ERROR
        status = 400
        msg = "Integrity error"

    payload = error_payload(
        code=code,
        message=msg,
        details={"db_error": str(getattr(exc, "orig", exc))},
    )
    return JSONResponse(status_code=status, content=payload)


def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
    payload = error_payload(
        code=ErrorCode.INTERNAL_ERROR,
        message="Internal server error",
        details={},
    )
    return JSONResponse(status_code=500, content=payload)