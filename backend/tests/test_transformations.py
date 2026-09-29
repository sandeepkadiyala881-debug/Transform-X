"""Tests for transformation creation, retrieval, listing and updates."""

from fastapi.testclient import TestClient

from tests.conftest import VALID_CONFIGURATION, VALID_OUTPUT_TYPES


def test_create_transformation(client: TestClient, make_source) -> None:
    source = make_source()
    payload = {
        "title": "Phishing advisory run",
        "source_id": source["id"],
        "configuration": VALID_CONFIGURATION,
        "output_types": VALID_OUTPUT_TYPES,
    }
    response = client.post("/api/v1/transformations", json=payload)
    assert response.status_code == 201, response.text

    data = response.json()["data"]
    assert data["status"] == "READY"
    assert data["source_id"] == source["id"]
    assert data["configuration"]["target_audience"] == "SECURITY_OFFICERS"
    assert len(data["outputs"]) == 3
    assert all(o["status"] == "PENDING" for o in data["outputs"])


def test_create_transformation_rejects_unknown_source(client: TestClient) -> None:
    payload = {
        "title": "Orphan transformation",
        "source_id": 999999,
        "configuration": VALID_CONFIGURATION,
        "output_types": VALID_OUTPUT_TYPES,
    }
    response = client.post("/api/v1/transformations", json=payload)
    assert response.status_code == 404


def test_create_transformation_rejects_invalid_output_type(client: TestClient, make_source) -> None:
    source = make_source()
    payload = {
        "title": "Bad output type",
        "source_id": source["id"],
        "configuration": VALID_CONFIGURATION,
        "output_types": ["NOT_A_REAL_TYPE"],
    }
    response = client.post("/api/v1/transformations", json=payload)
    assert response.status_code == 422


def test_create_transformation_rejects_duplicate_output_types(client: TestClient, make_source) -> None:
    source = make_source()
    payload = {
        "title": "Duplicate outputs",
        "source_id": source["id"],
        "configuration": VALID_CONFIGURATION,
        "output_types": ["ADVISORY", "ADVISORY"],
    }
    response = client.post("/api/v1/transformations", json=payload)
    assert response.status_code == 422


def test_get_transformation(client: TestClient, make_transformation) -> None:
    created = make_transformation(title="Retrievable run")
    response = client.get(f"/api/v1/transformations/{created['id']}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["title"] == "Retrievable run"
    assert data["configuration"] is not None
    assert len(data["outputs"]) == len(VALID_OUTPUT_TYPES)


def test_get_missing_transformation_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/transformations/999999")
    assert response.status_code == 404


def test_list_transformations(client: TestClient, make_transformation) -> None:
    make_transformation(title="Listed run A")
    make_transformation(title="Listed run B")
    response = client.get("/api/v1/transformations")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 2
    assert any(t["title"] == "Listed run A" for t in body["data"])


def test_list_transformations_filter_by_status(client: TestClient, make_transformation) -> None:
    make_transformation(title="Status-filtered run")
    response = client.get("/api/v1/transformations", params={"status": "READY"})
    assert response.status_code == 200
    assert all(t["status"] == "READY" for t in response.json()["data"])


def test_update_transformation_title(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    response = client.patch(f"/api/v1/transformations/{created['id']}", json={"title": "Renamed run"})
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Renamed run"


def test_update_transformation_valid_transition(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    response = client.patch(f"/api/v1/transformations/{created['id']}", json={"status": "PROCESSING"})
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "PROCESSING"


def test_update_transformation_rejects_invalid_transition(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    # READY -> COMPLETED skips PROCESSING and must be rejected.
    response = client.patch(f"/api/v1/transformations/{created['id']}", json={"status": "COMPLETED"})
    assert response.status_code == 400
    body = response.json()
    assert body["error"] == "invalid_request"


def test_update_missing_transformation_returns_404(client: TestClient) -> None:
    response = client.patch("/api/v1/transformations/999999", json={"title": "ghost"})
    assert response.status_code == 404
