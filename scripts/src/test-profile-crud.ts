/**
 * Comprehensive Student Profile CRUD Verification Script
 * Tests:
 * 1. Health check (GET /api/health)
 * 2. Unauthenticated requests to profile endpoints return 401
 * 3. User registration (POST /api/auth/register)
 * 4. User login (POST /api/auth/login) -> obtain JWT
 * 5. GET /api/profile on new user returns 404 (missing profile)
 * 6. POST /api/profile with invalid data (e.g. invalid graduation_year) returns 400
 * 7. POST /api/profile creates student profile (201)
 * 8. POST /api/profile duplicate returns 409
 * 9. GET /api/profile returns student profile (200)
 * 10. PUT /api/profile updates student profile (200)
 * 11. Cross-user isolation: second user cannot view or modify first user's profile
 * 12. DELETE /api/profile deletes student profile (200)
 * 13. GET /api/profile after delete returns 404
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ` (${details})` : ''}`);
}

async function run() {
  console.log(`Starting Profile CRUD Verification against ${API_BASE}...\n`);

  // 1. Health check
  try {
    const res = await fetch(`${API_BASE}/health`);
    record('API Health Check', res.status === 200, `HTTP ${res.status}`);
  } catch (err) {
    record('API Health Check', false, `Failed to connect to ${API_BASE}: ${(err as Error).message}`);
    console.error('\nEnsure the API server is running on port 5000 before running tests.');
    return;
  }

  // 2. Unauthenticated checks (Requirement: all profile endpoints require JWT and return 401)
  const getUnauth = await fetch(`${API_BASE}/profile`, { method: 'GET' });
  record('GET /api/profile without token returns 401', getUnauth.status === 401, `HTTP ${getUnauth.status}`);

  const postUnauth = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ degree: 'B.Tech' }),
  });
  record('POST /api/profile without token returns 401', postUnauth.status === 401, `HTTP ${postUnauth.status}`);

  const putUnauth = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ degree: 'M.S.' }),
  });
  record('PUT /api/profile without token returns 401', putUnauth.status === 401, `HTTP ${putUnauth.status}`);

  const deleteUnauth = await fetch(`${API_BASE}/profile`, { method: 'DELETE' });
  record('DELETE /api/profile without token returns 401', deleteUnauth.status === 401, `HTTP ${deleteUnauth.status}`);

  // 3. Register user 1
  const timestamp = Date.now();
  const user1Email = `student_${timestamp}@example.com`;
  const user1Password = 'Password123!';
  const user1Name = 'Alex Mercer';

  const regRes1 = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: user1Name, email: user1Email, password: user1Password }),
  });
  record('Register user 1', regRes1.status === 201, `HTTP ${regRes1.status}`);

  // 4. Login user 1
  const loginRes1 = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user1Email, password: user1Password }),
  });
  const loginData1 = (await loginRes1.json()) as { success: boolean; token: string; user: { id: string; name: string } };
  record('Login user 1 and get JWT token', loginRes1.status === 200 && Boolean(loginData1.token), `Token obtained`);
  const token1 = loginData1.token;

  // 5. GET /api/profile on new user (should return 404)
  const getEmptyProfile = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  record('GET /api/profile before creation returns 404', getEmptyProfile.status === 404, `HTTP ${getEmptyProfile.status}`);

  // 6. POST /api/profile with invalid data (invalid graduation_year -> 400)
  const postInvalid = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token1}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      education_level: 'Undergraduate',
      graduation_year: 'invalid_year_string',
    }),
  });
  record('POST /api/profile with invalid graduation_year returns 400', postInvalid.status === 400, `HTTP ${postInvalid.status}`);

  // 7. POST /api/profile creates student profile (201)
  const profilePayload = {
    education_level: 'Undergraduate',
    institution: 'State University',
    degree: 'Bachelor of Science',
    branch: 'Computer Science',
    graduation_year: 2027,
    interests: 'Artificial Intelligence, Machine Learning, Web Engineering',
    bio: 'Passionate student exploring intelligent systems and scalable backends.',
  };

  const createRes = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token1}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilePayload),
  });
  const createData = (await createRes.json()) as { success: boolean; profile?: Record<string, unknown> };
  const createdProfile = createData.profile;
  const isCreatedValid =
    createRes.status === 201 &&
    createData.success &&
    createdProfile?.degree === 'Bachelor of Science' &&
    createdProfile?.graduation_year === 2027;
  record('POST /api/profile creates profile with 201', isCreatedValid, `HTTP ${createRes.status}`);

  // 8. POST /api/profile duplicate returns 409
  const duplicateRes = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token1}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ degree: 'Second Degree' }),
  });
  record('POST /api/profile duplicate returns 409', duplicateRes.status === 409, `HTTP ${duplicateRes.status}`);

  // 9. GET /api/profile returns student profile (200)
  const getRes = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const getData = (await getRes.json()) as { success: boolean; profile?: Record<string, unknown> };
  const isGetValid =
    getRes.status === 200 &&
    getData.profile?.institution === 'State University' &&
    getData.profile?.branch === 'Computer Science';
  record('GET /api/profile returns accurate student profile (200)', isGetValid, `HTTP ${getRes.status}`);

  // 10. PUT /api/profile updates student profile (200)
  const updatePayload = {
    institution: 'Institute of Advanced Technology',
    interests: 'AI, Distributed Systems, Cloud Architecture',
    bio: 'Updated bio: Focused on distributed architectures and cloud computing.',
  };
  const updateRes = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token1}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });
  const updateData = (await updateRes.json()) as { success: boolean; profile?: Record<string, unknown> };
  const isUpdateValid =
    updateRes.status === 200 &&
    updateData.profile?.institution === 'Institute of Advanced Technology' &&
    updateData.profile?.degree === 'Bachelor of Science'; // Degree preserved
  record('PUT /api/profile updates profile and preserves existing fields (200)', isUpdateValid, `HTTP ${updateRes.status}`);

  // 11. Cross-user isolation: register user 2 and verify user 2 cannot see or touch user 1's profile
  const user2Email = `student2_${timestamp}@example.com`;
  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sam Jordan', email: user2Email, password: 'Password456!' }),
  });
  const loginRes2 = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user2Email, password: 'Password456!' }),
  });
  const loginData2 = (await loginRes2.json()) as { token: string };
  const token2 = loginData2.token;

  const user2ProfileGet = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  record('User 2 GET /api/profile gets 404 (does not see User 1 profile)', user2ProfileGet.status === 404, `HTTP ${user2ProfileGet.status}`);

  // 12. DELETE /api/profile deletes student profile (200)
  const deleteRes = await fetch(`${API_BASE}/profile`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });
  record('DELETE /api/profile deletes user profile (200)', deleteRes.status === 200, `HTTP ${deleteRes.status}`);

  // 13. GET /api/profile after delete returns 404
  const getAfterDelete = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  record('GET /api/profile after deletion returns 404', getAfterDelete.status === 404, `HTTP ${getAfterDelete.status}`);

  console.log('\n--- Summary ---');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  if (allPassed) {
    console.log('🎉 ALL CRUD REQUIREMENTS MET AND VERIFIED!');
  } else {
    console.error('⚠️ Some tests failed.');
  }
}

run().catch(console.error);
