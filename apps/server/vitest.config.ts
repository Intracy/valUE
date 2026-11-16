import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Die Tests teilen sich eine Datenbank und laufen deshalb nacheinander.
    fileParallelism: false,
    globalSetup: ['test/global-setup.ts'],
    testTimeout: 20_000,
  },
});
