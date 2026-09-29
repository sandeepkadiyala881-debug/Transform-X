"""SQLAlchemy engine, session factory, and FastAPI session dependency.

Routes never create connections themselves; they depend on ``get_db``.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# Connection pooling tuned for a small FastAPI service. pool_pre_ping drops
# dead connections after database restarts; pool_recycle guards against
# firewalls closing idle sockets. Server-side pooling (pgBouncer) can replace
# this later without touching call sites.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session per request, rolling back on failure."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
