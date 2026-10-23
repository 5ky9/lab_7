import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

const testEnv = dotenv.config({
  path: resolve(process.cwd(), '.env.test'),
  override: true,
  quiet: true,
});

export default defineConfig({
  test: {
    env: testEnv.parsed || {},
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    testTimeout: 15000,
    fileParallelism: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['routes/**/*.js', 'middleware/auth.js'],
      reporter: ['text', 'html'],
    },
  },
});
