import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

process.env.JWT_SECRET = 'test-secret-that-is-not-used-outside-this-test';

function response() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function token(role = 'user', options = {}) {
  return jwt.sign({ sub: '7', role }, process.env.JWT_SECRET, options);
}

test('requireAuth rejects a missing token with 401', () => {
  const res = response();
  let nextCalled = false;

  requireAuth({ headers: {} }, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('requireAuth attaches a verified user', () => {
  const req = { headers: { authorization: `Bearer ${token('admin')}` } };
  const res = response();
  let nextCalled = false;

  requireAuth(req, res, () => { nextCalled = true; });

  assert.deepEqual(req.user, { id: 7, role: 'admin' });
  assert.equal(nextCalled, true);
});

test('requireAuth rejects tokens signed with an unexpected algorithm', () => {
  const unsafeToken = jwt.sign(
    { sub: '7', role: 'admin' },
    process.env.JWT_SECRET,
    { algorithm: 'HS512' }
  );
  const res = response();

  requireAuth({ headers: { authorization: `Bearer ${unsafeToken}` } }, res, () => {});

  assert.equal(res.statusCode, 401);
});

test('requireRole rejects an authenticated non-admin with 403', () => {
  const res = response();
  let nextCalled = false;

  requireRole('admin')({ user: { id: 7, role: 'user' } }, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('optionalAuth permits guests and attaches valid users', () => {
  const guestResponse = response();
  let guestContinued = false;
  optionalAuth({ headers: {} }, guestResponse, () => { guestContinued = true; });

  const req = { headers: { authorization: `Bearer ${token()}` } };
  const userResponse = response();
  let userContinued = false;
  optionalAuth(req, userResponse, () => { userContinued = true; });

  assert.equal(guestContinued, true);
  assert.equal(guestResponse.statusCode, null);
  assert.deepEqual(req.user, { id: 7, role: 'user' });
  assert.equal(userContinued, true);
});

test('optionalAuth rejects an invalid supplied token', () => {
  const res = response();

  optionalAuth({ headers: { authorization: 'Bearer invalid' } }, res, () => {});

  assert.equal(res.statusCode, 401);
});
