import { beforeAll } from 'vitest';

/**
 * Refuse to run the suite against anything that is not a local database.
 *
 * The integration tests delete rows to clean up after themselves, and at least one
 * suite has historically done so unscoped. `vitest.config.ts` loads `.env.local`
 * BEFORE `.env.test`, and dotenv does not overwrite a key that is already set — so
 * a developer whose `.env.local` points at staging or production would have
 * `npm test` issue those deletes against real customer sales.
 *
 * There is no legitimate reason to run this suite against a remote database, so
 * this fails loudly rather than trusting everyone to notice.
 */
const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost', '0.0.0.0', '[::1]']);

beforeAll(() => {
  const url =
    process.env.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error(
      'PUBLIC_SUPABASE_URL is not set. The test suite cannot verify it is ' +
        'pointing at a local database, so it will not run. Check .env.test.'
    );
  }

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`PUBLIC_SUPABASE_URL is not a valid URL: ${url}`);
  }

  if (!ALLOWED_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run tests against a non-local database.\n\n` +
        `  PUBLIC_SUPABASE_URL resolves to host: ${host}\n\n` +
        `The integration suites delete rows during cleanup. Running them against ` +
        `a remote database would destroy real data.\n` +
        `Point PUBLIC_SUPABASE_URL at a local Supabase (npm run supabase:start), ` +
        `or unset it in .env.local so .env.test takes effect.`
    );
  }
});
