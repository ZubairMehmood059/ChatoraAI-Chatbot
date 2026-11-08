from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Verify /health returns 200 with correct schema."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Chatora AI"
    assert data["version"] == "1.0.0"
    assert "model" in data
    assert isinstance(data["configured"], bool)
    assert isinstance(data["authConfigured"], bool)
    assert "timestamp" in data


def test_security_headers(client: TestClient):
    """Verify standard security headers are attached to responses."""
    response = client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


def test_cors_preflight_and_headers(client: TestClient):
    """Verify CORS middleware permits configured origins."""
    headers = {"Origin": "http://localhost:3000"}
    response = client.get("/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_unhandled_api_route_returns_json_404(client: TestClient):
    """Verify non-existent API routes return JSON 404 rather than HTML."""
    response = client.get("/api/nonexistent_test_route")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"] == "API route not found"
    assert data["path"] == "/api/nonexistent_test_route"

