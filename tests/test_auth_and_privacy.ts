import http from 'http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function fetchJson(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING CHATORA AI AUTH & PRIVACY VERIFICATION SUITE ---');

  // Test 1: Health check
  const health = await fetchJson('/health');
  console.log('Test 1: Health probe ->', health.status, health.data.service);
  if (health.status !== 200) throw new Error('Health check failed');

  // Test 2: Unauthenticated /api/auth/me
  const unauthMe = await fetchJson('/api/auth/me');
  console.log('Test 2: Unauthenticated /api/auth/me ->', unauthMe.data);
  if (unauthMe.data.authenticated !== false) throw new Error('Expected unauthenticated: false');

  // Test 3: Authenticated user A session restoration
  const tokenA = 'demo_jwt_user_alice_12345';
  const meA = await fetchJson('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log('Test 3: User Alice /api/auth/me ->', meA.data);
  if (!meA.data.authenticated || meA.data.user.id !== 'user_alice') {
    throw new Error('Failed to authenticate User Alice');
  }

  // Test 4: User Alice creates a private conversation
  const createConvoA = await fetchJson('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ title: 'Alice Confidential AI Strategy' }),
  });
  console.log('Test 4: User Alice created conversation ->', createConvoA.status, createConvoA.data.id, 'owner:', createConvoA.data.userId);
  const convoAId = createConvoA.data.id;
  if (createConvoA.status !== 201 || !convoAId) throw new Error('Failed to create conversation for Alice');

  // Test 5: User Bob tries to list conversations - should NOT see Alice's conversation
  const tokenB = 'demo_jwt_user_bob_67890';
  const listB = await fetchJson('/api/conversations', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const foundAliceInBobList = listB.data.some((c: any) => c.id === convoAId);
  console.log('Test 5: User Bob lists conversations. Alice convo visible to Bob? ->', foundAliceInBobList);
  if (foundAliceInBobList) throw new Error('SECURITY VIOLATION: Alice conversation was visible in Bob list!');

  // Test 6: User Bob directly attempts GET /api/conversations/:id of Alice's conversation
  const getForbiddenB = await fetchJson(`/api/conversations/${convoAId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log('Test 6: User Bob attempts to access Alice conversation -> HTTP status:', getForbiddenB.status, getForbiddenB.data);
  if (getForbiddenB.status !== 403) throw new Error(`Expected 403 Forbidden, got ${getForbiddenB.status}`);

  // Test 7: User Bob attempts to rename Alice's conversation
  const patchForbiddenB = await fetchJson(`/api/conversations/${convoAId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ title: 'Hacked by Bob' }),
  });
  console.log('Test 7: User Bob attempts to patch Alice conversation -> HTTP status:', patchForbiddenB.status);
  if (patchForbiddenB.status !== 403) throw new Error(`Expected 403 Forbidden, got ${patchForbiddenB.status}`);

  // Test 8: User Bob attempts to delete Alice's conversation
  const deleteForbiddenB = await fetchJson(`/api/conversations/${convoAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log('Test 8: User Bob attempts to delete Alice conversation -> HTTP status:', deleteForbiddenB.status);
  if (deleteForbiddenB.status !== 403) throw new Error(`Expected 403 Forbidden, got ${deleteForbiddenB.status}`);

  // Test 9: User Bob attempts to inject message into Alice conversation via /api/chat
  const chatForbiddenB = await fetchJson('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      conversationId: convoAId,
      message: 'Unauthorized injection test',
    }),
  });
  console.log('Test 9: User Bob attempts to post to Alice conversation in /api/chat -> HTTP status:', chatForbiddenB.status);
  if (chatForbiddenB.status !== 403) throw new Error(`Expected 403 Forbidden on chat injection, got ${chatForbiddenB.status}`);

  // Test 10: User Alice legitimately accesses her own conversation
  const getAliceOwn = await fetchJson(`/api/conversations/${convoAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log('Test 10: User Alice accesses her own conversation -> HTTP status:', getAliceOwn.status, 'Title:', getAliceOwn.data.title);
  if (getAliceOwn.status !== 200 || getAliceOwn.data.id !== convoAId) {
    throw new Error('Alice could not access her own conversation');
  }

  // Test 11: User Alice deletes her own conversation
  const deleteAliceOwn = await fetchJson(`/api/conversations/${convoAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log('Test 11: User Alice deletes her own conversation -> HTTP status:', deleteAliceOwn.status);
  if (deleteAliceOwn.status !== 200) throw new Error('Alice failed to delete her own conversation');

  console.log('\n>>> ALL 11 AUTHENTICATION & PRIVACY TESTS PASSED PERFECTLY! <<<');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
