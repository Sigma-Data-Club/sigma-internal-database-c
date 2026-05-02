import os
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


def _get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer, got: {raw!r}") from exc


DATABASE_URL = _get_required_env("DATABASE_URL")

# Conservative defaults for an MVP on a simple server.
# They are explicit so growth is predictable instead of relying on driver defaults.
DB_POOL_SIZE = _get_int_env("DB_POOL_SIZE", 10)
DB_MAX_OVERFLOW = _get_int_env("DB_MAX_OVERFLOW", 20)
DB_POOL_TIMEOUT = _get_int_env("DB_POOL_TIMEOUT", 30)
DB_POOL_RECYCLE = _get_int_env("DB_POOL_RECYCLE", 1800)


class Base(DeclarativeBase):
    pass


engine: Engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
    pool_use_lifo=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> None:
    """
    Fail fast if the application cannot talk to the database.
    Called on startup from FastAPI lifespan.
    """
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def dispose_engine() -> None:
    """
    Close pooled connections on application shutdown.
    """
    engine.dispose()