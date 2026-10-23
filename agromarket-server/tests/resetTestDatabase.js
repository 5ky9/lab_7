import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';

function getTestDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is missing. Copy .env.test.example to .env.test and create agromarket_test.'
    );
  }

  let databaseName;
  try {
    databaseName = decodeURIComponent(new URL(connectionString).pathname.slice(1));
  } catch {
    throw new Error('DATABASE_URL in .env.test is not a valid PostgreSQL URL.');
  }

  if (databaseName !== 'agromarket_test') {
    throw new Error(
      `Refusing to reset database "${databaseName}". Test setup only permits "agromarket_test".`
    );
  }
  return connectionString;
}

export async function resetTestDatabase() {
  const connectionString = getTestDatabaseUrl();
  const secret = process.env.JWT_SECRET;
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET in .env.test must be at least 32 characters.');
  }
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error(
      'Set TEST_ADMIN_EMAIL and a TEST_ADMIN_PASSWORD of at least 12 characters in .env.test.'
    );
  }

  const pool = new pg.Pool({ connectionString, max: 1 });
  try {
    const schema = await readFile(resolve(process.cwd(), 'db/schema.sql'), 'utf8');
    const data = JSON.parse(
      await readFile(resolve(process.cwd(), 'data/db.json'), 'utf8')
    );
    await pool.query(schema);

    for (const product of data.products) {
      await pool.query(
        `INSERT INTO products (name, category, price, unit, image)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          product.name,
          product.category ?? null,
          Math.round(Number(product.price)),
          product.unit ?? 'кг',
          product.image ?? null,
        ]
      );
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      ['Test Administrator', adminEmail.trim().toLowerCase(), passwordHash]
    );
  } finally {
    await pool.end();
  }
}
