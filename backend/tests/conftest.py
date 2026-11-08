import pytest
import os
import tempfile
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient

# Keep the test suite isolated from a developer's configured database and the
# application's persistent instance database.
_test_database_dir = tempfile.TemporaryDirectory(prefix="chatora-tests-")
os.environ["DATABASE_URL"] = (
    f"sqlite+aiosqlite:///{_test_database_dir.name}/test.db"
)

from backend.app.dependencies import UserContext, get_optional_user
from backend.app.main import create_app


@pytest.fixture
def client():
    """Synchronous TestClient fixture that enters FastAPI lifespan."""
    app = create_app()

    async def test_user_override(request: Request):
        """Recognize synthetic test identities only inside this test app."""
        token = request.headers.get("authorization", "")
        if token.startswith("Bearer test-user-"):
            user_id = token.removeprefix("Bearer test-user-")
            return UserContext(id=user_id, email=f"{user_id}@tests.invalid")
        if token:
            raise HTTPException(status_code=401, detail="Invalid test authorization token")
        return None

    app.dependency_overrides[get_optional_user] = test_user_override
    with TestClient(app) as test_client:
        yield test_client
