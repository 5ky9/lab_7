import { afterEach, describe, expect, it } from 'vitest';
import { resetTestDatabase } from './resetTestDatabase.js';

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe('Test database safety guard', () => {
  it('refuses to reset a database other than agromarket_test', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/agromarket';

    await expect(resetTestDatabase()).rejects.toThrow(
      'Test setup only permits "agromarket_test"'
    );
  });

  it('refuses to reset a database when no URL is configured', async () => {
    delete process.env.DATABASE_URL;

    await expect(resetTestDatabase()).rejects.toThrow(
      'DATABASE_URL is missing'
    );
  });
});
