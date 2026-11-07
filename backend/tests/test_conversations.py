from fastapi.testclient import TestClient


def test_conversation_lifecycle_guest(client: TestClient):
    """Test full CRUD lifecycle for guest sessions."""
    # 1. Create
    res = client.post("/api/conversations", json={"title": "Guest Chat"})
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Guest Chat"
    convo_id = data["id"]

    # 2. List
    list_res = client.get("/api/conversations")
    assert list_res.status_code == 200
    ids = [c["id"] for c in list_res.json()]
    assert convo_id in ids

    # 3. Get detail
    detail_res = client.get(f"/api/conversations/{convo_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == convo_id

    # 4. Patch title & pin
    patch_res = client.patch(
        f"/api/conversations/{convo_id}",
        json={"title": "Updated Guest Chat", "pinned": True},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated Guest Chat"
    assert patch_res.json()["pinned"] is True

    # 5. Delete
    del_res = client.delete(f"/api/conversations/{convo_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 6. Verify deleted
    get_del = client.get(f"/api/conversations/{convo_id}")
    assert get_del.status_code == 404


def test_cross_user_isolation_and_ownership(client: TestClient):
    """Verify User Bob cannot access, update, or delete User Alice's private conversations (BOLA/IDOR)."""
    alice_headers = {"Authorization": "Bearer demo_jwt_user_alice_12345"}
    bob_headers = {"Authorization": "Bearer demo_jwt_user_bob_67890"}

    # Alice creates conversation
    create_res = client.post(
        "/api/conversations",
        json={"title": "Alice Confidential Strategy"},
        headers=alice_headers,
    )
    assert create_res.status_code == 201
    convo_id = create_res.json()["id"]

    # Bob lists conversations - should NOT see Alice's conversation
    bob_list = client.get("/api/conversations", headers=bob_headers)
    assert bob_list.status_code == 200
    assert not any(c["id"] == convo_id for c in bob_list.json())

    # Bob directly attempts GET Alice's conversation -> 403 Forbidden
    bob_get = client.get(f"/api/conversations/{convo_id}", headers=bob_headers)
    assert bob_get.status_code == 403
    assert "Forbidden" in bob_get.json()["error"]

    # Bob attempts PATCH Alice's conversation -> 403 Forbidden
    bob_patch = client.patch(
        f"/api/conversations/{convo_id}",
        json={"title": "Compromised Title"},
        headers=bob_headers,
    )
    assert bob_patch.status_code == 403

    # Bob attempts DELETE Alice's conversation -> 403 Forbidden
    bob_delete = client.delete(f"/api/conversations/{convo_id}", headers=bob_headers)
    assert bob_delete.status_code == 403

    # Alice legitimately accesses her own conversation -> 200 OK
    alice_get = client.get(f"/api/conversations/{convo_id}", headers=alice_headers)
    assert alice_get.status_code == 200
    assert alice_get.json()["title"] == "Alice Confidential Strategy"

    # Alice deletes her own conversation -> 200 OK
    alice_delete = client.delete(f"/api/conversations/{convo_id}", headers=alice_headers)
    assert alice_delete.status_code == 200


def test_conversation_search_filter(client: TestClient):
    """Verify search query parameter filters conversation titles."""
    headers = {"Authorization": "Bearer demo_jwt_user_searcher_999"}
    client.post("/api/conversations", json={"title": "Python Microservice"}, headers=headers)
    client.post("/api/conversations", json={"title": "React Architecture"}, headers=headers)

    res_py = client.get("/api/conversations?search=Microservice", headers=headers)
    assert res_py.status_code == 200
    items = res_py.json()
    assert len(items) >= 1
    assert all("microservice" in c["title"].lower() for c in items)

