from fastapi import FastAPI

from app.routers.members import router as members_router
from app.routers.auth import router as auth_router
from app.routers.roles import router as roles_router
from app.routers.permissions import router as permissions_router

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError

from app.core.exception_handlers import (
    http_exception_handler,
    request_validation_handler,
    integrity_error_handler,
    unhandled_exception_handler,
)

app = FastAPI()

app.include_router(members_router)
app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(permissions_router)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, request_validation_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}