import uuid
from fastapi.testclient import TestClient


def test_unauthenticated_me(client: TestClient):
    """Verify /api/auth/me returns authenticated: false when unauthenticated."""
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["authenticated"] is False
    assert response.json()["user"] is None


def test_authenticated_test_identity(client: TestClient):
    """Verify only the test app's explicit identity override recognizes test users."""
    headers = {"Authorization": "Bearer test-user-user_alice"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user"]["id"] == "user_alice"
    assert data["user"]["email"] == "user_alice@tests.invalid"


def test_invalid_token_rejected(client: TestClient):
    """Verify self-asserted demo tokens are not accepted as authentication."""
    headers = {"Authorization": "Bearer demo_jwt_user_admin_12345"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    assert "Invalid" in response.json()["error"]


def test_local_registration_and_login_lifecycle(client: TestClient):
    """Test local fallback user registration and login."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"testuser_local_{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # 1. Register
    reg_res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["success"] is True
    assert reg_res.json()["user"]["email"] == email

    # 2. Duplicate registration rejected
    dup_res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert dup_res.status_code == 400

    # 3. Login with wrong password rejected
    bad_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    # 4. Login with correct password succeeded
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    assert login_res.json()["success"] is True
    assert login_res.json()["user"]["email"] == email

    # 5. Logout acknowledged
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True
