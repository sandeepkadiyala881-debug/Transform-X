"""Tests for output listing and retrieval."""

from fastapi.testclient import TestClient


def test_outputs_seeded_on_transformation_creation(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    response = client.get("/api/v1/outputs", params={"transformation_id": created["id"]})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert {o["output_type"] for o in body["data"]} == {"ADVISORY", "EXECUTIVE_SUMMARY", "LINKEDIN"}


def test_get_output(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    outputs = client.get("/api/v1/outputs", params={"transformation_id": created["id"]}).json()["data"]
    output_id = outputs[0]["id"]

    response = client.get(f"/api/v1/outputs/{output_id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == output_id
    assert data["status"] == "PENDING"
    assert data["content"] is None  # AI generation arrives in Phase 5


def test_get_missing_output_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/outputs/999999")
    assert response.status_code == 404


def test_list_outputs_filter_by_type(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    response = client.get("/api/v1/outputs", params={"output_type": "ADVISORY"})
    assert response.status_code == 200
    assert all(o["output_type"] == "ADVISORY" for o in response.json()["data"])


def test_create_output_record(client: TestClient, make_transformation) -> None:
    created = make_transformation()
    payload = {
        "transformation_id": created["id"],
        "output_type": "INFOGRAPHIC",
        "title": "Manual record",
        "content": None,
    }
    response = client.post("/api/v1/outputs", json=payload)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["output_type"] == "INFOGRAPHIC"
    assert data["status"] == "PENDING"


def test_create_output_rejects_unknown_transformation(client: TestClient) -> None:
    payload = {"transformation_id": 999999, "output_type": "ADVISORY", "title": "Orphan"}
    response = client.post("/api/v1/outputs", json=payload)
    assert response.status_code == 404
