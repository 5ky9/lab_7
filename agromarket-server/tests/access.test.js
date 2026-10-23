import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getAdminToken, getUserToken } from './helpers.js';

describe('Ролевой доступ к товарам и заявкам', () => {
  let adminToken;
  let userToken;
  let productId;
  let orderId;

  beforeAll(async () => {
    [adminToken, userToken] = await Promise.all([getAdminToken(), getUserToken()]);
  });

  it('rejects product creation without a token (401)', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({ name: 'Unauthorized product', price: 100 });

    expect(response.status).toBe(401);
  });

  it('rejects product creation by a regular user (403)', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Forbidden product', price: 100 });

    expect(response.status).toBe(403);
  });

  it('validates product data for an admin', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Invalid product', price: -1 });

    expect(response.status).toBe(400);
  });

  it('rejects product ids that are not numeric', async () => {
    const response = await request(app).get('/api/products/not-a-number');

    expect(response.status).toBe(400);
  });

  it('allows an admin to create, update, and delete a product', async () => {
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Vitest sample product', category: 'Tests', price: 125, unit: 'кг' });

    expect(created.status).toBe(201);
    productId = created.body.id;

    const updated = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Vitest product', category: 'Tests', price: 150, unit: 'кг' });

    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Updated Vitest product');

    const forbiddenDelete = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbiddenDelete.status).toBe(403);

    const deleted = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);

    const missing = await request(app).get(`/api/products/${productId}`);
    expect(missing.status).toBe(404);
  });

  it('requires an admin to list all customer orders', async () => {
    const anonymous = await request(app).get('/api/orders');
    expect(anonymous.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body)).toBe(true);
  });

  it('requires authentication to read the current user orders', async () => {
    const response = await request(app).get('/api/orders/my');

    expect(response.status).toBe(401);
  });

  it('creates customer orders and restricts them to the owning user', async () => {
    const missingFields = await request(app)
      .post('/api/orders')
      .send({ name: 'Buyer' });
    expect(missingFields.status).toBe(400);

    const invalid = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: 1, name: 'Buyer', email: 'buyer@test.kz', quantity: 5 });
    expect(invalid.status).toBe(400);

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        product_id: 1,
        name: 'Test Buyer',
        email: 'BUYER@test.kz',
        quantity: 10,
        comment: 'Integration test',
      });
    expect(created.status).toBe(201);
    expect(created.body.email).toBe('buyer@test.kz');
    orderId = created.body.id;

    const ownOrders = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect(ownOrders.status).toBe(200);
    expect(ownOrders.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: orderId, user_id: expect.any(Number) }),
    ]));

    const forbidden = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(forbidden.status).toBe(200);
    expect(forbidden.body).toEqual([]);
  });

  it('allows admins to update an order status and validates status values', async () => {
    const forbidden = await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'processing' });
    expect(forbidden.status).toBe(403);

    const invalid = await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'unknown' });
    expect(invalid.status).toBe(400);

    const updated = await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing' });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('processing');

    const missing = await request(app)
      .patch('/api/orders/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'done' });
    expect(missing.status).toBe(404);
  });
});
