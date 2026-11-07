from fastapi.testclient import TestClient


def test_valid_feedback_submission(client: TestClient):
    """Test valid feedback submission produces 201 and reference ID."""
    payload = {
        "name": "Jane Developer",
        "email": "jane@example.com",
        "category": "feature",
        "message": "Please add support for multi-model comparison in the chat interface.",
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["referenceId"].startswith("fb_")
    assert "received" in data["message"].lower()


def test_honeypot_spam_detection(client: TestClient):
    """Test honeypot submission fools spam bots without persisting corrupted data."""
    payload = {
        "name": "Spam Bot",
        "email": "bot@spam.com",
        "category": "bug",
        "message": "Click here to buy cheap sunglasses online today!",
        "hp_website": "https://spam.example.com",
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "hp" in data["referenceId"]


def test_feedback_validation_errors(client: TestClient):
    """Test short message and invalid email are rejected with 400."""
    # Short message (< 10 chars)
    res_short = client.post(
        "/api/feedback",
        json={
            "name": "Jane",
            "email": "jane@example.com",
            "category": "bug",
            "message": "Short",
        },
    )
    assert res_short.status_code == 400

    # Invalid email
    res_email = client.post(
        "/api/feedback",
        json={
            "name": "Jane",
            "email": "not-an-email",
            "category": "bug",
            "message": "Valid length message explaining a bug.",
        },
    )
    assert res_email.status_code == 400

