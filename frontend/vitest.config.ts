import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Server-side logic and the API surface. db.ts and firebase/admin.ts are
      // thin Firestore glue that needs the emulator to test meaningfully.
      include: ['src/lib/server/**', 'src/lib/ai/**', 'src/lib/api/client.ts', 'src/app/api/**'],
      exclude: ['**/__tests__/**', 'src/lib/server/db.ts'],
      // Ratchet: raise these as coverage grows, never lower them to get green.
      thresholds: { lines: 90, functions: 95, branches: 85, statements: 90 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
