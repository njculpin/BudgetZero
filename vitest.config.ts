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

/**
 * Files matching this glob need a live Postgres. Everything else mocks the
 * data-access layer and runs anywhere, including GitHub Actions.
 *
 * A naming convention rather than an exclude list, because a list rots silently:
 * the next integration test lands in the unit lane, CI fails in Actions with
 * ECONNREFUSED, and the author has no idea a list exists.
 */
const INTEGRATION_GLOB = '**/*.integration.test.ts';

const shared = {
  globals: true,
  environment: 'jsdom' as const,
  setupFiles: ['./vitest.setup.ts'],
};

const testConfig: { test: ViteUserConfig['test'] } = {
  test: {
    projects: [
      {
        test: {
          ...shared,
          name: 'unit',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['node_modules', 'dist', '.astro', 'e2e', INTEGRATION_GLOB],
          env: { MOCK_STRIPE: 'true' },
        },
      },
      {
        test: {
          ...shared,
          name: 'integration',
          include: [INTEGRATION_GLOB],
          env: { MOCK_STRIPE: 'true' },
          // These suites share ONE Postgres. `isolate` separates module state,
          // not database state, so parallel files interleave inserts against the
          // same tables.
          fileParallelism: false,
        },
      },
    ],
    isolate: true,
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
