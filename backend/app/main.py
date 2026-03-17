from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exception_handlers import (
    http_exception_handler,
    integrity_error_handler,
    request_validation_handler,
    unhandled_exception_handler,
)
from app.db.database import check_database_connection, dispose_engine, engine
from app.routers import projects
from app.routers.auth import router as auth_router
from app.routers.events import router as events_router
from app.routers.members import router as members_router
from app.routers.permissions import router as permissions_router
from app.routers.roles import router as roles_router
from app.ai.router import router as ai_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    check_database_connection()
    yield
    dispose_engine()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Sigma Internal Database C API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(members_router)
    app.include_router(auth_router)
    app.include_router(roles_router)
    app.include_router(permissions_router)
    app.include_router(events_router)
    app.include_router(projects.router)
    app.include_router(ai_router)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    @app.get("/", tags=["system"])
    def read_root():
        return {
            "status": "ok",
            "service": "sigma-internal-database-c-api",
        }

    @app.get("/health", tags=["system"])
    def health():
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return {"status": "ok"}
        except Exception:
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="Database unavailable")

    return app


app = create_app()