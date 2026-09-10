import type { AstroCookies } from 'astro';
import type { CookieJar, CookieOptions } from '@gameloopers/api/context';
import { resolveAuth, type ResolvedAuth } from '@gameloopers/api/gateway';

/**
 * Resolving the signed-in visitor inside an `.astro` page.
 *
 * Sixteen pages carried their own copy of this: read two cookies, call
 * `setSession`, check the result, delete the cookies on failure, pull the user
 * out. Each copy was a network round trip to the auth provider per render, and
 * each was a chance to get a step wrong — the API routes had exactly this
 * duplication and one of the copies had been answering 401 to every caller for
 * months before anyone noticed.
 *
 * `resolveAuth` verifies the token's signature locally, contacts the provider
 * only to renew an expired session, and clears dead cookies itself.
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

/** The subset of the caller a page renders with. */
export interface PageUser {
  id: string;
  email?: string;
}

/**
 * The signed-in visitor, or `null`.
 *
 * For pages that render for everyone and merely show more to someone signed in.
 */
export async function getPageUser(cookies: AstroCookies): Promise<PageUser | null> {
  const { userId, userEmail } = await resolvePageAuth(cookies);
  if (!userId) return null;
  return { id: userId, email: userEmail ?? undefined };
}

/**
 * The signed-in visitor, or a redirect to sign-in.
 *
 * ```ts
 * const auth = await requirePageUser(Astro, '/cart');
 * if (auth instanceof Response) return auth;
 * // auth.id is a signed-in user from here on
 * ```
 *
 * Returns the `Response` rather than throwing because that is how an Astro page
 * redirects, and because it keeps the control flow visible at the call site.
 */
export async function requirePageUser(
  context: { cookies: AstroCookies; redirect: (path: string, status?: 302) => Response },
  returnTo?: string
): Promise<PageUser | Response> {
  const user = await getPageUser(context.cookies);
  if (user) return user;

  const target = returnTo
    ? `/sign-in?redirect=${encodeURIComponent(returnTo)}`
    : '/sign-in';

  return context.redirect(target);
}
