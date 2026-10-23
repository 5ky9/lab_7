import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from '../middleware/auth.js';

const secret = process.env.JWT_SECRET;

function createResponse() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

function createToken(claims = { sub: '7', role: 'user' }, options = {}) {
  return jwt.sign(claims, secret, options);
}

describe('requireAuth', () => {
  it('responds 401 when no token is provided', () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the user from a verified token', () => {
    const req = {
      headers: { authorization: `Bearer ${createToken({ sub: '7', role: 'admin' })}` },
    };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: 7, role: 'admin' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects expired tokens with an explicit error', () => {
    const token = createToken({ sub: '7', role: 'user' }, { expiresIn: -1 });
    const res = createResponse();
    const next = vi.fn();

    requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Срок действия токена истёк, войдите снова',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects claims with an invalid user id or role', () => {
    const token = createToken({ sub: 'not-an-id', role: 'superuser' });
    const res = createResponse();

    requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('optionalAuth', () => {
  it('allows a guest request without an authorization header', () => {
    const next = vi.fn();

    optionalAuth({ headers: {} }, createResponse(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('attaches a valid user to the request', () => {
    const req = {
      headers: { authorization: `Bearer ${createToken({ sub: '9', role: 'user' })}` },
    };
    const next = vi.fn();

    optionalAuth(req, createResponse(), next);

    expect(req.user).toEqual({ id: 9, role: 'user' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects an invalid token instead of treating it as a guest', () => {
    const res = createResponse();
    const next = vi.fn();

    optionalAuth({ headers: { authorization: 'Bearer invalid' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a signed token containing an invalid role', () => {
    const token = createToken({ sub: '9', role: 'superuser' });
    const res = createResponse();
    const next = vi.fn();

    optionalAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Недействительный токен' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  it('allows a user with the required role', () => {
    const next = vi.fn();

    requireRole('admin')({ user: { id: 1, role: 'admin' } }, createResponse(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 for an authenticated user with a different role', () => {
    const res = createResponse();
    const next = vi.fn();

    requireRole('admin')({ user: { id: 1, role: 'user' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 if called without an authenticated user', () => {
    const res = createResponse();
    const next = vi.fn();

    requireRole('admin')({}, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
