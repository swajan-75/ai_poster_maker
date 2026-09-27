import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false, // one mongodb-memory-server at a time
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
