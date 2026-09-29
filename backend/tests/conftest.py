"""Shared pytest fixtures.

Tests run against the isolated ``transform_x_test`` database. Each test gets
its own transaction (savepoint-based) that is rolled back afterwards, so
tests never leak data into each other and never touch the dev database.
"""

from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app

import app.models  # noqa: F401 — register all tables on metadata


@pytest.fixture(scope="session")
def test_engine():
    settings = get_settings()
    url = settings.test_database_url or settings.database_url.replace("/transform_x", "/transform_x_test")
    engine = create_engine(url)
    # Sync the schema from metadata on every run: tests stay independent of
    # migration state (fresh or partially migrated DBs both work), while
    # migrations remain the source of truth for the dev/prod database.
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(test_engine) -> Generator[Session, None, None]:
    """A session bound to an outer transaction rolled back after the test."""
    connection = test_engine.connect()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    connection.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient whose dependency-injected sessions share the test transaction."""

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture()
def db_ok(test_engine) -> bool:
    """Explicit connectivity probe used by the database tests."""
    with test_engine.connect() as conn:
        return conn.execute(text("SELECT 1")).scalar() == 1


# ---------------------------------------------------------------------------
# Payload factories shared across test modules
# ---------------------------------------------------------------------------

VALID_CONFIGURATION = {
    "target_audience": "SECURITY_OFFICERS",
    "tone": "PROFESSIONAL",
    "language": "ENGLISH",
    "detail_level": "DETAILED",
    "communication_objective": "ALERT",
    "content_style": "ADVISORY",
}

VALID_OUTPUT_TYPES = ["ADVISORY", "EXECUTIVE_SUMMARY", "LINKEDIN"]


@pytest.fixture()
def make_source(client: TestClient):
    """Factory creating text sources through the API."""

    def _create(title: str = "Test source", content: str = "Test source content") -> dict:
        response = client.post("/api/v1/sources/text", json={"title": title, "text_content": content})
        assert response.status_code == 201, response.text
        return response.json()["data"]

    return _create


@pytest.fixture()
def make_transformation(client: TestClient, make_source):
    """Factory creating transformations with valid payloads."""

    def _create(title: str = "Test transformation") -> dict:
        source = make_source()
        payload = {
            "title": title,
            "source_id": source["id"],
            "configuration": VALID_CONFIGURATION,
            "output_types": VALID_OUTPUT_TYPES,
        }
        response = client.post("/api/v1/transformations", json=payload)
        assert response.status_code == 201, response.text
        return response.json()["data"]

    return _create
