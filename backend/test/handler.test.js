// backend/test/handler.test.js
const test = require('node:test');
const assert = require('node:assert');
const { handler, pool } = require('../server');

// Helpers to simulate req and res
function mockReq(url) { return { url }; }
function mockRes() {
  const res = { status: null, headers: null, body: '' };
  res.writeHead = (code, headers) => { res.status = code; res.headers = headers; };
  res.end = (chunk = '') => { res.body += chunk; };
  return res;
}

// Test: health endpoint (async, DB mocked)
test('health endpoint returns OK', { timeout: 10000 }, async () => {
  // 1) Mock pool.query so SELECT 1 works without real Postgres
  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [] });

  try {
    const req = mockReq('/health');
    const res = mockRes();

    // 2) Call handler – it schedules work in 5s
    handler(req, res);

    // 3) Wait a bit longer than 5s for the timeout to fire
    await new Promise(resolve => setTimeout(resolve, 5500));

    // 4) Now assert
    assert.equal(res.status, 200);
    assert.match(res.body, /OK/);
  } finally {
    // 5) Restore original pool.query in case of other tests
    pool.query = originalQuery;
  }
});
