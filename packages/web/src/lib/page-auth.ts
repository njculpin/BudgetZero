import type { AstroCookies } from 'astro';
import type { CookieJar, CookieOptions } from '@gameloopers/api/context';
import { resolveAuth, type ResolvedAuth } from '@gameloopers/api/gateway';

/**
 * Resolve the signed-in user inside an `.astro` page.
 *
 * Pages are not controllers — they render, they do not return a `Response` — so
 * they cannot go through `toAstroRoute`. They still need the same answer to the
 * same question, and should get it the same way: one local signature check
 * rather than another round trip to the auth provider.
 */
function toCookieJar(cookies: AstroCookies): CookieJar {
  return {
    get: (name) => cookies.get(name)?.value,
    set: (name, value, options?: CookieOptions) => cookies.set(name, value, options),
    delete: (name, options) => cookies.delete(name, options),
  };
}

export function resolvePageAuth(cookies: AstroCookies): Promise<ResolvedAuth> {
  return resolveAuth(toCookieJar(cookies));
}
