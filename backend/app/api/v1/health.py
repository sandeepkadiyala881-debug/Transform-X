"""Health endpoints: liveness and PostgreSQL connectivity."""

from fastapi import APIRouter
from sqlalchemy import text

from app.config import get_settings
from app.db.session import engine
from app.utils.logging import get_logger

router = APIRouter(prefix="/health", tags=["Health"])
logger = get_logger("health")
settings = get_settings()


@router.get(
    "",
    summary="Service health check",
    description="Returns service status, name and version.",
)
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "transform-x-api",
        "version": settings.app_version,
    }


@router.get(
    "/db",
    summary="Database connectivity check",
    description="Verifies PostgreSQL connectivity. Never exposes credentials.",
)
def db_health() -> dict[str, str]:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:  # noqa: BLE001 — health must not raise
        logger.error("db_health_failed error=%s", type(exc).__name__)
        return {"status": "error", "database": "unavailable"}
