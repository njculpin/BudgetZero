import { fileURLToPath } from 'node:url';
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

/**
 * Test roots. `packages/*` is listed explicitly rather than globbing from the
 * repository root: a bare `**` also walks node_modules, and the workspace
 * symlinks under node_modules/@gameloopers point straight back at packages/,
 * so every suite there would be collected twice.
 */
const UNIT_INCLUDE = ['packages/*/src/**/*.{test,spec}.{ts,tsx}'];

const INTEGRATION_INCLUDE = ['packages/*/src/**/*.integration.test.ts'];

/**
 * Pointing Astro at packages/web (below) also makes it Vite's root, which would
 * resolve the `packages/*` globs relative to packages/web and collect nothing.
 * The test root is pinned back to the repository so one run still covers every
 * package.
 */
const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));

const shared = {
  globals: true,
  environment: 'jsdom' as const,
  root: REPO_ROOT,
  setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
};

const testConfig: { test: ViteUserConfig['test'] } = {
  test: {
    projects: [
      {
        test: {
          ...shared,
          name: 'unit',
          include: UNIT_INCLUDE,
          exclude: ['node_modules', 'dist', '.astro', 'e2e', INTEGRATION_GLOB],
          env: { MOCK_STRIPE: 'true' },
        },
      },
      {
        test: {
          ...shared,
          name: 'integration',
          include: INTEGRATION_INCLUDE,
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

/**
 * `getViteConfig` loads the Astro config to build a matching Vite pipeline —
 * SolidJS JSX, the `@` alias, `.astro` handling. That config now lives in
 * packages/web, so Astro is pointed at it explicitly; left to default it would
 * look in the repository root, find nothing, and every component test would fail
 * to transform.
 *
 * Tests still run from the repository root so that one invocation covers every
 * package.
 */
export default getViteConfig(
  testConfig as Parameters<typeof getViteConfig>[0],
  { root: fileURLToPath(new URL('./packages/web', import.meta.url)) }
);
