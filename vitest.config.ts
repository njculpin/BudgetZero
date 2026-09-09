import { getViteConfig } from 'astro/config';
import type { ViteUserConfig } from 'vitest/config';
import dotenv from 'dotenv';

/**
 * Load environment variables for tests.
 *
 * `.env.test` holds the local Supabase demo credentials and is committed, so the
 * suite is reproducible on a fresh clone. `.env.local` is loaded first when present
 * so a developer can point the suite at their own stack, and dotenv never overwrites
 * an already-set key.
 */
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test' });

const testConfig: { test: ViteUserConfig['test'] } = {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.astro', 'e2e'],
    isolate: true,
    env: {
      MOCK_STRIPE: 'true',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        '**/*.config.{js,ts}',
        '**/types/**',
      ],
    },
  },
};

export default getViteConfig(testConfig as Parameters<typeof getViteConfig>[0]);
