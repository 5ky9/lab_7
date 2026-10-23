import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { resetTestDatabase } from '../tests/resetTestDatabase.js';

dotenv.config({
  path: resolve(process.cwd(), '.env.test'),
  override: true,
  quiet: true,
});

await resetTestDatabase();
console.log('Test database agromarket_test has been reset and seeded.');
