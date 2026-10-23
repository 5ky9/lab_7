import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Публичный каталог товаров', () => {
  it('returns the seeded product list', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Молоко', price: 450 }),
    ]));
  });

  it('filters products by the search query', async () => {
    const response = await request(app).get('/api/products').query({ search: 'Мол' });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((product) => product.name.toLowerCase().includes('мол'))).toBe(true);
  });

  it('returns 404 when the product does not exist', async () => {
    const response = await request(app).get('/api/products/999999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Товар не найден');
  });

  it('у товара есть id, name и price', async () => {
    const response = await request(app).get('/api/products');
    const product = response.body[0];

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
  });

  it('GET /api/products/:id возвращает тот же товар, что в списке', async () => {
    const list = await request(app).get('/api/products');
    const first = list.body[0];

    const response = await request(app).get(`/api/products/${first.id}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(first.name);
  });
});