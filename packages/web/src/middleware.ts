import { defineMiddleware } from 'astro:middleware';
import { resolvePageAuth } from '@/lib/page-auth';

/**
 * Page routes that require a session.
 *
 * These are pages, not endpoints: an anonymous visitor is redirected to sign-in
 * rather than handed a 401 they would never see. Individual pages still perform
 * their own ownership and role checks; this only establishes that someone is
 * signed in.
 */
const PROTECTED_ROUTES = ['/payouts', '/connect/dashboard', '/admin'];

/**
 * `/api` is deliberately absent.
 *
 * Every API route is served by the catch-all at `pages/api/[...path].ts`, which
 * resolves the caller and enforces the `public` flag declared on each route in
 * `@gameloopers/api/routes`. Gating here as well would mean two lists of public
 * paths, in two packages, that have to agree — and under the previous
 * arrangement two routes were protected *only* by their absence from the list
 * here, with no check of their own.
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * The authentication gate for pages.
 *
 * This used to exchange the session cookies with the auth provider over the
 * network and stash the result on `locals` — which nothing ever read, because
 * every route repeated the same exchange for itself. Two round trips per
 * authenticated request, one of them entirely wasted.
 *
 * `resolvePageAuth` verifies the token's signature locally and reaches the
 * provider only to renew an expired session.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;

  if (!isProtectedRoute(url.pathname)) return next();

  try {
    const { userId, userEmail, failure } = await resolvePageAuth(cookies);

    if (!userId) {
      // A missing signing key is a deployment fault, not a signed-out user.
      // Sending someone to sign-in would hide the real problem behind a
      // redirect loop they can never escape.
      if (failure === 'unconfigured') {
        console.error('Auth is not configured: no signing key available.');
      }
      return redirect('/sign-in');
    }

    // Kept for pages that read it. `resolvePageAuth` has already refreshed the
    // cookies if that was needed, so this is the current session either way.
    locals.user = { id: userId, email: userEmail ?? undefined };

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return redirect('/sign-in');
  }
});
