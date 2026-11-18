// ==============================================================================
// test-api.js - Automated API Test Runner
// Tests all required Lab 4 endpoints and edge cases.
// ==============================================================================

const http = require('http');
const app = require('./server');

const TEST_PORT = 3001;
let server;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Automated API Tests for Lab 4');
  console.log('======================================================\n');

  const BASE_URL = `http://localhost:${TEST_PORT}`;

  async function makeRequest(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  let passed = 0;
  let total = 0;

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    // Test 0: Health check
    const t0 = await makeRequest('/');
    assert('Test 0: Server Root / Health Check', t0.status === 200 && t0.data.student.name === 'Reddy Mahitha', JSON.stringify(t0.data));

    // Reset test user 'mahitha' so test is 100% reproducible on every run
    const db = require('./database');
    await new Promise((resolve) => {
      db.run('DELETE FROM users WHERE username = ?;', ['mahitha'], () => resolve());
    });

    // Test 1: Successful Registration
    const t1 = await makeRequest('/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'mahitha',
        name: 'Mahitha',
        password: 'mahitha123'
      })
    });
    assert('Test 1: Successful Registration (HTTP 201)', t1.status === 201 && t1.data.message === 'User registered successfully', JSON.stringify(t1.data));
    assert('Test 1: Password NOT exposed in registration response', !t1.data.password && !t1.data.hash, 'Password found in response!');

    // Test 2: Duplicate Registration
    const t2 = await makeRequest('/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'mahitha',
        name: 'Mahitha',
        password: 'mahitha123'
      })
    });
    assert('Test 2: Duplicate Username Registration (HTTP 400)', t2.status === 400 && t2.data.error === 'User already exists', JSON.stringify(t2.data));

    // Test 3: Successful Login
    const t3 = await makeRequest('/login/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'mahitha',
        password: 'mahitha123'
      })
    });
    assert('Test 3: Successful Login (HTTP 200 & JWT returned)', t3.status === 200 && typeof t3.data.jwt_token === 'string', JSON.stringify(t3.data));

    // Test 3b: Verify JWT Payload structure
    if (t3.data && t3.data.jwt_token) {
      const parts = t3.data.jwt_token.split('.');
      assert('Test 3b: JWT has 3 parts (Header.Payload.Signature)', parts.length === 3);
      const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      assert('Test 3c: JWT payload contains username', decodedPayload.username === 'mahitha');
      assert('Test 3d: JWT payload does NOT contain password or hash', !decodedPayload.password && !decodedPayload.hash);
      console.log('   Decoded JWT Payload:', JSON.stringify(decodedPayload));
    }

    // Test 4: Login with Unknown Username
    const t4 = await makeRequest('/login/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'unknown_user_999',
        password: 'password123'
      })
    });
    assert('Test 4: Login with Unknown Username (HTTP 400)', t4.status === 400 && t4.data.error === 'Invalid user', JSON.stringify(t4.data));

    // Test 5: Login with Incorrect Password
    const t5 = await makeRequest('/login/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'mahitha',
        password: 'wrong_password_xyz'
      })
    });
    assert('Test 5: Login with Incorrect Password (HTTP 400)', t5.status === 400 && t5.data.error === 'Invalid password', JSON.stringify(t5.data));

    // Test 6: Registration with Missing Fields
    const t6a = await makeRequest('/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'incomplete_user'
      })
    });
    assert('Test 6a: Missing fields during registration (HTTP 400)', t6a.status === 400 && t6a.data.error.includes('Missing required fields'), JSON.stringify(t6a.data));

    // Test 6b: Login with Missing Fields
    const t6b = await makeRequest('/login/', {
      method: 'POST',
      body: JSON.stringify({
        username: 'mahitha'
      })
    });
    assert('Test 6b: Missing password during login (HTTP 400)', t6b.status === 400 && t6b.data.error.includes('Missing required fields'), JSON.stringify(t6b.data));

    // Test 7: Verify Protected Route with JWT (jwt.verify)
    if (t3.data && t3.data.jwt_token) {
      const t7 = await makeRequest('/profile', {
        headers: { Authorization: `Bearer ${t3.data.jwt_token}` }
      });
      assert('Test 7: Protected Route Access with JWT (HTTP 200)', t7.status === 200 && t7.data.user.username === 'mahitha', JSON.stringify(t7.data));
    }

    console.log('\n======================================================');
    console.log(`📊 Test Results: ${passed}/${total} passed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error executing tests:', err);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(passed === total ? 0 : 1);
  }
}

// Start temporary test server
server = http.createServer(app).listen(TEST_PORT, () => {
  runTests();
});
