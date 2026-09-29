"""Tests for health endpoints and database connectivity."""

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "transform-x-api"
    assert "version" in body


def test_database_connectivity(db_ok: bool) -> None:
    assert db_ok, "Expected to connect to the isolated test database"


def test_health_db_endpoint_reports_connection(client: TestClient) -> None:
    response = client.get("/api/v1/health/db")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"
