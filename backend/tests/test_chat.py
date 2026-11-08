import json
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from backend.app.config import get_settings


def test_chat_empty_message_validation(client: TestClient):
    """Verify empty message is rejected with 400 Bad Request."""
    res = client.post("/api/chat", json={"message": "   "})
    assert res.status_code == 400
    assert "Message cannot be empty" in res.json()["error"]


def test_chat_unconfigured_gemini_returns_503(client: TestClient):
    """Verify 503 is returned when Gemini API key is missing or unconfigured."""
    settings = get_settings()
    with patch.object(settings, "GEMINI_API_KEY", ""):
        res = client.post("/api/chat", json={"message": "Hello AI"})
        assert res.status_code == 503
        data = res.json()
        assert data["error"] == "GEMINI_NOT_CONFIGURED"
        assert "Secrets panel" in data["message"]


def test_chat_cross_user_forbidden(client: TestClient):
    """Verify user Bob cannot post chat messages to Alice's conversation."""
    alice_headers = {"Authorization": "Bearer test-user-alice_stream"}
    bob_headers = {"Authorization": "Bearer test-user-bob_stream"}

    # Alice creates conversation
    create_res = client.post(
        "/api/conversations",
        json={"title": "Alice Streaming Talk"},
        headers=alice_headers,
    )
    assert create_res.status_code == 201
    convo_id = create_res.json()["id"]

    # Bob attempts to post message to Alice's conversation
    res = client.post(
        "/api/chat",
        json={"conversationId": convo_id, "message": "Bob Intrusion"},
        headers=bob_headers,
    )
    assert res.status_code == 403
    assert "Forbidden" in res.json()["error"]


def test_chat_successful_mocked_stream(client: TestClient):
    """Verify successful SSE streaming generation and message persistence (Mocked AI provider)."""
    headers = {"Authorization": "Bearer test-user-chatstream"}
    # Create conversation
    create_res = client.post(
        "/api/conversations",
        json={"title": "Streaming Test Convo"},
        headers=headers,
    )
    assert create_res.status_code == 201
    convo_id = create_res.json()["id"]

    # Mock chunk generator
    async def mock_stream_chat(*args, **kwargs):
        yield "Hello "
        yield "world! "
        yield "This is a streaming response."

    with patch("backend.app.routers.chat.ai_service.stream_chat", side_effect=mock_stream_chat):
        with patch("backend.app.routers.chat.ai_service.generate_title", return_value="Streaming Hello World"):
            with patch("backend.app.config.Settings.is_gemini_configured", return_value=True):
                res = client.post(
                    "/api/chat",
                    json={
                        "conversationId": convo_id,
                        "message": "Say hello to the world",
                        "responseStyle": "concise",
                    },
                    headers=headers,
                )
                assert res.status_code == 200
                assert res.headers["content-type"].startswith("text/event-stream")

                # Parse SSE events from response text
                events = []
                for line in res.text.split("\n"):
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str:
                            events.append(json.loads(data_str))

                # Verify sequence of SSE event types: start -> chunks -> done
                event_types = [e["type"] for e in events]
                assert event_types[0] == "start"
                assert "chunk" in event_types
                assert event_types[-1] == "done"

                chunks = [e["text"] for e in events if e["type"] == "chunk"]
                full_text = "".join(chunks)
                assert full_text == "Hello world! This is a streaming response."

                done_event = events[-1]
                assert done_event["fullText"] == full_text
                assert done_event["title"] == "Streaming Hello World"

    # Verify conversation now contains both user and assistant messages in the database
    get_res = client.get(f"/api/conversations/{convo_id}", headers=headers)
    assert get_res.status_code == 200
    convo_data = get_res.json()
    assert len(convo_data["messages"]) == 2
    assert convo_data["messages"][0]["role"] == "user"
    assert convo_data["messages"][0]["content"] == "Say hello to the world"
    assert convo_data["messages"][1]["role"] == "assistant"
    assert convo_data["messages"][1]["content"] == full_text
    assert convo_data["messages"][1]["status"] == "complete"


def test_chat_error_handling_in_stream(client: TestClient):
    """Verify upstream provider error (e.g. 429 rate limit) formats SSE error event cleanly (Mocked AI provider)."""
    headers = {"Authorization": "Bearer test-user-chaterror"}
    create_res = client.post(
        "/api/conversations",
        json={"title": "Rate Limit Test"},
        headers=headers,
    )
    convo_id = create_res.json()["id"]

    async def mock_rate_limit_stream(*args, **kwargs):
        raise Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
        yield "never"

    with patch("backend.app.routers.chat.ai_service.stream_chat", side_effect=mock_rate_limit_stream):
        with patch("backend.app.config.Settings.is_gemini_configured", return_value=True):
            res = client.post(
                "/api/chat",
                json={"conversationId": convo_id, "message": "Trigger Rate Limit"},
                headers=headers,
            )
            assert res.status_code == 200
            assert "text/event-stream" in res.headers["content-type"]

            events = [
                json.loads(line[6:].strip())
                for line in res.text.split("\n")
                if line.startswith("data: ") and line[6:].strip()
            ]
            error_event = next((e for e in events if e["type"] == "error"), None)
            assert error_event is not None
            assert "Rate limit reached" in error_event["error"]


def test_guest_chat_is_transient(client: TestClient):
    """Unauthenticated chat streams but creates no shared persisted conversation."""
    async def mock_stream(*args, **kwargs):
        yield "Transient answer"

    with patch("backend.app.routers.chat.ai_service.stream_chat", side_effect=mock_stream):
        with patch("backend.app.config.Settings.is_gemini_configured", return_value=True):
            response = client.post("/api/chat", json={"message": "Hello"})

    assert response.status_code == 200
    assert '"type": "done"' in response.text
    assert client.get("/api/conversations").json() == []


def test_guest_cannot_continue_saved_conversation(client: TestClient):
    """A guest cannot attach an arbitrary ID to access a saved conversation."""
    response = client.post(
        "/api/chat",
        json={"conversationId": "conv_private", "message": "Hello"},
    )
    assert response.status_code == 401


def test_response_language_is_added_to_gemini_instruction():
    """Verify the selected language reaches Gemini's trusted system instruction."""
    from backend.app.services.ai_service import ai_service

    instruction = ai_service.build_system_instruction(
        response_style="balanced",
        response_language="Urdu",
    )
    assert "entire response in Urdu" in instruction

