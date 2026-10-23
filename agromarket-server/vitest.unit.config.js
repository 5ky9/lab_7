import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'lab8-unit-test-secret-not-for-use-outside-tests',
    },
    include: ['tests/middleware.test.js', 'tests/databaseSafety.test.js'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['middleware/auth.js'],
      reporter: ['text', 'html'],
    },
  },
});
