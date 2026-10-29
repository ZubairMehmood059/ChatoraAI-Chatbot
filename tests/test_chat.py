import pytest
from unittest.mock import patch, MagicMock
from app import create_app
from app.extensions import db
from config import TestingConfig

@pytest.fixture
def client():
    app = create_app(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_chat_validation_empty_message(client):
    res = client.post('/api/chat', json={'message': ''})
    assert res.status_code == 400
    data = res.get_json()
    assert 'error' in data

def test_chat_missing_api_key_error(client):
    res = client.post('/api/chat', json={'message': 'Hello AI'})
    assert res.status_code == 503
    data = res.get_json()
    assert data['error'] == 'GEMINI_NOT_CONFIGURED'

@patch('app.services.ai_service.genai.Client')
def test_mocked_ai_streaming(mock_genai_client, client):
    # Mock GenAI response
    mock_instance = MagicMock()
    mock_chunk1 = MagicMock()
    mock_chunk1.text = "Hello! "
    mock_chunk2 = MagicMock()
    mock_chunk2.text = "I am Chatora AI."
    mock_instance.models.generate_content_stream.return_value = [mock_chunk1, mock_chunk2]
    mock_genai_client.return_value = mock_instance

    # Temporarily set API key
    client.application.config['GEMINI_API_KEY'] = 'test-key-mock'

    res = client.post('/api/chat', json={'message': 'Hi there'})
    assert res.status_code == 200
    assert 'text/event-stream' in res.content_type
    body = res.get_data(as_text=True)
    assert 'start' in body
    assert 'chunk' in body
    assert 'Hello! ' in body
    assert 'done' in body
