import { defineConfig } from 'vitest/config';
import path from 'path';

/** Config for `npm run eval:triage` only; the normal test run ignores *.eval.ts. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['evaluation/**/*.eval.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
