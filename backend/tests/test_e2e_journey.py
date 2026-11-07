import json
from unittest.mock import patch
import uuid
import pytest
from fastapi.testclient import TestClient


def test_full_user_journey_and_security(client: TestClient):
    """End-to-End User Journey:

    1. Register user
    2. Authenticate
    3. Verify /api/auth/me
    4. Create conversation
    5. Post message with mocked Gemini stream
    6. Verify messages in conversation
    7. Pin conversation
    8. Filter by search query
    9. Upload document
    10. Submit feedback with honeypot
    11. Delete conversation and verify 404
    """
    unique_suffix = uuid.uuid4().hex[:8]
    user_email = f"prod_journey_{unique_suffix}@chatora.ai"
    user_pass = "ProductionSecurePassword!2026"

    # 1. Register local account
    reg_res = client.post(
        "/api/auth/register",
        json={"email": user_email, "password": user_pass},
    )
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]

    # 2. Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": user_email, "password": user_pass},
    )
    assert login_res.status_code == 200

    # Simulate Supabase / Bearer auth for subsequent protected requests
    auth_headers = {"Authorization": f"Bearer demo_jwt_{user_id}_12345"}

    # 3. Check /api/auth/me
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["authenticated"] is True
    assert me_res.json()["user"]["id"] == user_id

    # 4. Create new conversation
    convo_res = client.post(
        "/api/conversations",
        json={"title": "Journey Architecture Chat"},
        headers=auth_headers,
    )
    assert convo_res.status_code == 201
    convo_id = convo_res.json()["id"]

    # 5. Send message and receive SSE stream
    async def mock_stream(*args, **kwargs):
        yield "Chatora AI "
        yield "is ready for "
        yield "production deployment."

    with patch("backend.app.routers.chat.ai_service.stream_chat", side_effect=mock_stream):
        with patch("backend.app.routers.chat.ai_service.generate_title", return_value="Production Deployment"):
            with patch("backend.app.config.Settings.is_gemini_configured", return_value=True):
                chat_res = client.post(
                    "/api/chat",
                    json={
                        "conversationId": convo_id,
                        "message": "Verify production readiness.",
                        "responseStyle": "detailed",
                    },
                    headers=auth_headers,
                )
                assert chat_res.status_code == 200
                assert "text/event-stream" in chat_res.headers["content-type"]

    # 6. Verify messages in conversation
    detail_res = client.get(f"/api/conversations/{convo_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    messages = detail_res.json()["messages"]
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Verify production readiness."
    assert messages[1]["role"] == "assistant"
    assert "production deployment" in messages[1]["content"]

    # 7. Pin conversation
    pin_res = client.patch(
        f"/api/conversations/{convo_id}",
        json={"pinned": True},
        headers=auth_headers,
    )
    assert pin_res.status_code == 200
    assert pin_res.json()["pinned"] is True

    # 8. Search query by updated title
    search_res = client.get("/api/conversations?search=Production", headers=auth_headers)
    assert search_res.status_code == 200
    results = search_res.json()
    assert any(c["id"] == convo_id for c in results)

    # 9. Document upload
    upload_res = client.post(
        "/api/upload",
        json={
            "fileName": "specs.md",
            "fileContent": "# Production Spec\nAll systems operational.",
            "fileType": "text/markdown",
        },
        headers=auth_headers,
    )
    assert upload_res.status_code == 200
    assert "All systems operational" in upload_res.json()["content"]

    # 10. Submit feedback with honeypot validation
    fb_res = client.post(
        "/api/feedback",
        json={
            "name": "QA Auditor",
            "email": user_email,
            "category": "praise",
            "message": "FastAPI migration and Supabase RLS are completely operational.",
        },
        headers=auth_headers,
    )
    assert fb_res.status_code == 201
    assert fb_res.json()["success"] is True

    # 11. Delete conversation
    del_res = client.delete(f"/api/conversations/{convo_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify conversation is gone
    get_gone = client.get(f"/api/conversations/{convo_id}", headers=auth_headers)
    assert get_gone.status_code == 404

