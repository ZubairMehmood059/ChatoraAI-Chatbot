import pytest
from fastapi.testclient import TestClient
from backend.app.main import create_app


@pytest.fixture
def client():
    """Synchronous TestClient fixture that enters FastAPI lifespan."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
