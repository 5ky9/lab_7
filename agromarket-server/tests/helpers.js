import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../app.js';

export function uniqueEmail(prefix = 'user') {
  return `${prefix}-${randomUUID()}@test.kz`;
}

export async function getUserToken() {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Buyer',
      email: uniqueEmail(),
      password: 'TestUserPassword123!',
    });

  if (response.status !== 201) {
    throw new Error(`Failed to register a test user: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.token;
}

export async function getAdminToken() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD,
    });

  if (response.status !== 200) {
    throw new Error(`Failed to authenticate the test admin: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.token;
}
