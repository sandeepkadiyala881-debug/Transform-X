"""TRANSFORM-X FastAPI application entry point.

Kept intentionally small: configuration, middleware, error handlers and
router registration. No business logic lives here.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.config import get_settings
from app.utils.errors import AppError
from app.utils.logging import configure_logging, get_logger

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Log application startup and shutdown."""
    logger.info("startup service=%s version=%s env=%s", settings.app_name, settings.app_version, settings.environment)
    yield
    logger.info("shutdown service=%s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "TRANSFORM-X — AI-Powered Content Transformation Platform.\n\n"
        "Turns one source of information into multiple actionable communication "
        "deliverables. Phase 2 provides the persistence foundation: sources, "
        "transformation sessions, generation configurations and output records."
    ),
    lifespan=lifespan,
)

# CORS — explicit origins from configuration, never a wildcard in code.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    """Consistent JSON shape for expected application errors."""
    logger.warning("app_error status=%s error=%s message=%s", exc.status_code, exc.error, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all 500 that never leaks stack traces to clients."""
    logger.error(
        "unhandled_error path=%s error=%s", request.url.path, type(exc).__name__
    )
    message = "Internal server error" if settings.is_production else f"Internal server error: {type(exc).__name__}"
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": message},
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)
