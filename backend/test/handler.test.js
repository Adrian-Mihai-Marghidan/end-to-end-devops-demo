// backend/test/handler.test.js
const test = require('node:test');
const assert = require('node:assert');
const { handler } = require('../server');

// Helpers to simulate req and res
function mockReq(url) { return { url }; }
function mockRes() {
  const res = { status: null, headers: null, body: '' };
  res.writeHead = (code, headers) => { res.status = code; res.headers = headers; };
  res.end = (chunk='') => { res.body += chunk; };
  return res;
}

// Test: health endpoint
test('health endpoint returns OK', () => {
  const req = mockReq('/health');
  const res = mockRes();
  handler(req, res);
  assert.equal(res.status, 200);
  assert.match(res.body, /OK/);
});
