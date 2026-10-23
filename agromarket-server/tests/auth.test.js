import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { pool } from '../db/pool.js';
import { uniqueEmail } from './helpers.js';

describe('Регистрация, вход и профиль', () => {
  const email = uniqueEmail('buyer');
  const password = 'StrongTestPassword123!';
  let token;

  it('requires all registration fields', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    expect(response.status).toBe(400);
  });

  it('rejects a blank registration name', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: '   ', email: uniqueEmail(), password });

    expect(response.status).toBe(400);
  });

  it('rejects a password shorter than eight characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Buyer', email: uniqueEmail(), password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/8 символов/);
  });

  it('creates only a user account and never returns the password hash', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Buyer',
        email: email.toUpperCase(),
        password,
        role: 'admin',
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Test Buyer',
      email,
      role: 'user',
    });
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(response.body.token).toEqual(expect.any(String));
    token = response.body.token;
  });

  it('rejects a duplicate e-mail with 409', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Duplicate Buyer', email: email.toUpperCase(), password });

    expect(response.status).toBe(409);
  });

  it('logs in with a case-insensitive e-mail and returns a safe user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: email.toUpperCase(), password });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email, role: 'user' });
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('returns the same authentication error for an incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongTestPassword123!' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Неверный email или пароль');
  });

  it('requires credentials to log in', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.status).toBe(400);
  });

  it('requires a token to access the current user profile', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('returns the current user profile for a valid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ email, role: 'user' });
    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('changes the password only when the current password is correct', async () => {
    const missingFields = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(missingFields.status).toBe(400);

    const rejected = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'WrongTestPassword123!', newPassword: 'ChangedTestPassword123!' });
    expect(rejected.status).toBe(400);

    const shortPassword = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'short' });
    expect(shortPassword.status).toBe(400);

    const changed = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'ChangedTestPassword123!' });
    expect(changed.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'ChangedTestPassword123!' });
    expect(login.status).toBe(200);
  });

  it('returns 404 when a valid token belongs to a deleted account', async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(404);

    const passwordChange = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'ChangedTestPassword123!', newPassword: 'AnotherTestPassword123!' });
    expect(passwordChange.status).toBe(404);
  });
});

describe('Вход администратора и защита от перебора', () => {
  it('админ входит и получает JWT из трёх частей', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.token.split('.')).toHaveLength(3);
    expect(response.body.user.role).toBe('admin');
  });

  it('неверный пароль и неизвестный e-mail дают одинаковый ответ', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.TEST_ADMIN_EMAIL, password: 'не-тот-пароль' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail('nobody'), password: 'не-тот-пароль' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});