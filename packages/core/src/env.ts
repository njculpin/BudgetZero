/**
 * Portable environment access.
 *
 * The rest of core reads `import.meta.env.X` directly, which Vite replaces at
 * build time. That works for every current consumer (Astro, Vitest) but ties
 * core to a Vite-based bundler — a plain Node or Bun worker importing core would
 * see `undefined` for everything.
 *
 * Reading through here instead keeps the same behaviour under Vite while
 * degrading to `process.env` elsewhere. New code in core should use this;
 * the existing direct uses can migrate when `packages/workers` lands.
 */
export function readEnv(key: string): string | undefined {
  // `process.env` is read first, and deliberately so. `import.meta.env` is
  // resolved when the bundle is built, which means a test cannot change it and a
  // deployment cannot override it without a rebuild. Server runtimes always have
  // `process.env`; a browser bundle has no `process` at all and falls through to
  // the inlined values, which is the only place they are the right answer.
  if (typeof process !== 'undefined' && process.env) {
    const fromProcess = process.env[key];
    if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  }

  const viteEnv = import.meta.env as Record<string, string | undefined> | undefined;
  const fromVite = viteEnv?.[key];
  if (fromVite !== undefined && fromVite !== '') return fromVite;

  return undefined;
}

/** Same, but fails loudly instead of handing back `undefined` to a caller that cannot proceed. */
export function requireEnv(key: string): string {
  const value = readEnv(key);
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Check .env.local (development) or the deployment environment.`
    );
  }
  return value;
}
