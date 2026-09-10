import { verifyAccessToken } from '@gameloopers/core/auth/verify-token';
import { refreshSession } from '@gameloopers/core/auth/session';
import { readEnv } from '@gameloopers/core/env';
import type { AuthFailure, CookieJar, CookieOptions } from './context';

/**
 * Resolving who is calling, once per request.
 *
 * The old arrangement did this twice: `middleware.ts` exchanged the session
 * cookies for a user and stored the result on `locals`, then each route
 * performed the identical exchange again — and nothing ever read `locals`. Since
 * the exchange reached the auth provider over the network, an authenticated
 * request paid two round trips before running any of its own logic.
 *
 * Here it happens once, and the common case costs no network at all: an access
 * token is a signed JWT, so a valid one is confirmed by checking its signature
 * locally. Only an expired token needs the provider, and only to be renewed.
 */

export const ACCESS_TOKEN_COOKIE = 'sb-access-token';
export const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

/**
 * Cookie lifetimes.
 *
 * The refresh cookie outlives the access cookie, so a user who has been away for
 * a fortnight is renewed rather than signed out. The routes disagreed about this
 * too: sign-up gave the refresh cookie 30 days, sign-in gave it 7, so how long
 * you stayed signed in depended on how you had created your account.
 */
const ACCESS_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * One definition of how a session cookie is written.
 *
 * The routes disagreed about this. `sign-up` set `httpOnly: true` and
 * `secure` in production; `sign-in` and the OAuth `callback` set both to false,
 * leaving the access token readable by any script on the page. Which door a user
 * came in through decided whether their session could be stolen by an XSS bug.
 *
 * `httpOnly` is safe to apply: every read of these cookies is server-side.
 */
/**
 * Whether this is a production deployment, for the `secure` cookie flag.
 *
 * Vite and Astro set `import.meta.env.PROD` as a *boolean*; a plain Node or Bun
 * runtime has no such thing and reports `NODE_ENV` instead. Comparing the
 * boolean against the string 'true' silently yielded false, which would have
 * shipped session cookies without the Secure flag to production.
 */
function isProduction(): boolean {
  // NODE_ENV first: it is the explicit, runtime-settable signal, present on
  // Vercel and on any Node or Bun host, and the only one a test can change.
  const nodeEnv = readEnv('NODE_ENV');
  if (nodeEnv) return nodeEnv === 'production';

  const viteEnv = (import.meta as { env?: { PROD?: boolean } }).env;
  if (typeof viteEnv?.PROD === 'boolean') return viteEnv.PROD;

  // Unknown environment: assume production, because the failure modes are not
  // symmetric. A Secure cookie that should not be is a broken local dev setup;
  // a missing Secure flag in production is a session token over plain HTTP.
  return true;
}

function sessionCookieOptions(maxAge: number): CookieOptions {
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    maxAge,
  };
}

export function setSessionCookies(
  cookies: CookieJar,
  tokens: { accessToken: string; refreshToken: string }
): void {
  cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, sessionCookieOptions(ACCESS_MAX_AGE));
  cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, sessionCookieOptions(REFRESH_MAX_AGE));
}

export function clearSessionCookies(cookies: CookieJar): void {
  cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
  cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/' });
}

export interface ResolvedAuth {
  userId: string | null;
  /** The verified access token, for the few calls that must act as the user. */
  accessToken: string | null;
  userEmail: string | null;
  failure: AuthFailure | null;
}

/**
 * Establish the caller's identity from their cookies.
 *
 * Renews an expired session in place when the refresh token still holds, writing
 * the new pair back so the user is not signed out mid-session. A refresh token
 * that no longer works clears the cookies rather than leaving a dead pair to be
 * retried on every subsequent request.
 */
export async function resolveAuth(cookies: CookieJar): Promise<ResolvedAuth> {
  const accessToken = cookies.get(ACCESS_TOKEN_COOKIE);
  const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE);

  if (!accessToken && !refreshToken) {
    return { userId: null, accessToken: null, userEmail: null, failure: 'anonymous' };
  }

  if (accessToken) {
    const result = await verifyAccessToken(accessToken);

    if (result.ok) {
      return {
        userId: result.token.userId,
        accessToken,
        userEmail: result.token.email ?? null,
        failure: null,
      };
    }

    // A misconfigured server must not look like a signed-out user: that would
    // silently sign everybody out and read as an auth bug rather than a
    // deployment one.
    if (result.reason === 'unconfigured') {
      return { userId: null, accessToken: null, userEmail: null, failure: 'unconfigured' };
    }

    if (result.reason === 'invalid') {
      clearSessionCookies(cookies);
      return { userId: null, accessToken: null, userEmail: null, failure: 'invalid' };
    }
    // 'expired' falls through to the refresh attempt below.
  }

  if (!refreshToken) {
    clearSessionCookies(cookies);
    return { userId: null, accessToken: null, userEmail: null, failure: 'expired' };
  }

  const renewed = await refreshSession(refreshToken);
  if (!renewed) {
    clearSessionCookies(cookies);
    return { userId: null, accessToken: null, userEmail: null, failure: 'expired' };
  }

  setSessionCookies(cookies, renewed);
  // A refreshed session carries no decoded claims here; the email is read back
  // from the new token so the context stays consistent either way.
  const claims = await verifyAccessToken(renewed.accessToken);
  return {
    userId: renewed.userId,
    accessToken: renewed.accessToken,
    userEmail: claims.ok ? (claims.token.email ?? null) : null,
    failure: null,
  };
}
