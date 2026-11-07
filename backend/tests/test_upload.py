from fastapi.testclient import TestClient


def test_valid_file_upload(client: TestClient):
    """Test valid text and markdown document uploads."""
    payload = {
        "fileName": "guide.md",
        "fileContent": "# Getting Started\nThis is a clean markdown document for testing.",
        "fileType": "text/markdown",
    }
    response = client.post("/api/upload", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["fileName"] == "guide.md"
    assert data["extractedLength"] > 0
    assert "Getting Started" in data["content"]


def test_file_size_limit_rejection(client: TestClient):
    """Test that payloads exceeding the 2MB limit are rejected with 413."""
    oversized_content = "A" * 3_500_000
    payload = {
        "fileName": "oversized.txt",
        "fileContent": oversized_content,
    }
    response = client.post("/api/upload", json=payload)
    assert response.status_code == 413
    assert "exceeds" in response.json()["error"].lower()


def test_unsupported_file_extension_rejection(client: TestClient):
    """Test that executable or disallowed extensions are rejected with 400."""
    payload = {
        "fileName": "malicious.exe",
        "fileContent": "MZ9000BINARYCONTENT",
    }
    response = client.post("/api/upload", json=payload)
    assert response.status_code == 400
    assert "not supported" in response.json()["error"]


def test_path_traversal_sanitization(client: TestClient):
    """Test that directory traversal sequences in filename are sanitized."""
    payload = {
        "fileName": "../../etc/passwd",
        "fileContent": "root:x:0:0:root:/root:/bin/bash",
    }
    response = client.post("/api/upload", json=payload)
    # The file has no allowed extension or is sanitized safely
    assert response.status_code in (200, 400)
    if response.status_code == 200:
        assert "/" not in response.json()["fileName"]
        assert ".." not in response.json()["fileName"]

