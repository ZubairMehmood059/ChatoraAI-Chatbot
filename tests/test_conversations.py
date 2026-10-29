import pytest
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

def test_create_and_list_conversations(client):
    # Initially empty
    res = client.get('/api/conversations')
    assert res.status_code == 200
    assert res.get_json() == []

    # Create new conversation
    res = client.post('/api/conversations', json={'title': 'Project Ideas'})
    assert res.status_code == 201
    convo = res.get_json()
    assert convo['title'] == 'Project Ideas'
    convo_id = convo['id']

    # List conversations
    res = client.get('/api/conversations')
    assert res.status_code == 200
    convos = res.get_json()
    assert len(convos) == 1
    assert convos[0]['id'] == convo_id

    # Rename conversation
    res = client.patch(f'/api/conversations/{convo_id}', json={'title': 'Updated Title'})
    assert res.status_code == 200
    assert res.get_json()['title'] == 'Updated Title'

    # Pin conversation
    res = client.patch(f'/api/conversations/{convo_id}', json={'pinned': True})
    assert res.status_code == 200
    assert res.get_json()['pinned'] is True

    # Delete conversation
    res = client.delete(f'/api/conversations/{convo_id}')
    assert res.status_code == 200

    # Verify deleted
    res = client.get('/api/conversations')
    assert len(res.get_json()) == 0
