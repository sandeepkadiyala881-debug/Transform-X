"""Tests for source creation and retrieval."""

from fastapi.testclient import TestClient


def test_create_text_source(client: TestClient) -> None:
    payload = {
        "title": "Enterprise phishing report",
        "text_content": "INCIDENT REPORT — credential phishing campaign against enterprise employees.",
    }
    response = client.post("/api/v1/sources/text", json=payload)
    assert response.status_code == 201, response.text

    body = response.json()
    assert body["message"] == "Text source created successfully"
    data = body["data"]
    assert data["id"] > 0
    assert data["source_type"] == "TEXT"
    assert data["title"] == payload["title"]
    assert data["text_content"].startswith("INCIDENT REPORT")
    assert data["created_at"] is not None


def test_create_text_source_rejects_blank_content(client: TestClient) -> None:
    response = client.post("/api/v1/sources/text", json={"title": "x", "text_content": "   "})
    assert response.status_code == 422


def test_create_text_source_rejects_missing_title(client: TestClient) -> None:
    response = client.post("/api/v1/sources/text", json={"text_content": "content"})
    assert response.status_code == 422


def test_get_source(client: TestClient, make_source) -> None:
    created = make_source(title="Retrievable source")
    response = client.get(f"/api/v1/sources/{created['id']}")
    assert response.status_code == 200
    assert response.json()["data"]["id"] == created["id"]
    assert response.json()["data"]["title"] == "Retrievable source"


def test_get_missing_source_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/sources/999999")
    assert response.status_code == 404
    body = response.json()
    assert body["error"] == "not_found"


def test_list_sources(client: TestClient, make_source) -> None:
    make_source(title="List source A")
    make_source(title="List source B")
    response = client.get("/api/v1/sources")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 2
    assert any(s["title"] == "List source A" for s in body["data"])


def test_list_sources_filter_by_type(client: TestClient, make_source) -> None:
    make_source(title="Typed source")
    response = client.get("/api/v1/sources", params={"source_type": "TEXT"})
    assert response.status_code == 200
    assert all(s["source_type"] == "TEXT" for s in response.json()["data"])
