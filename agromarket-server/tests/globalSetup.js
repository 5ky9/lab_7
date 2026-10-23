import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { resetTestDatabase } from './resetTestDatabase.js';

export default async function setup() {
  dotenv.config({
    path: resolve(process.cwd(), '.env.test'),
    override: true,
    quiet: true,
  });
  await resetTestDatabase();
}
