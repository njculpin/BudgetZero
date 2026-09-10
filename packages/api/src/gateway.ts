import { verifyAccessToken } from '@gameloopers/core/auth/verify-token';
import { refreshSession } from '@gameloopers/core/auth/session';
import { readEnv } from '@gameloopers/core/env';
import type { AuthFailure, CookieJar, CookieOptions } from './context';

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
  cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    sessionCookieOptions(ACCESS_MAX_AGE)
  );
  cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    sessionCookieOptions(REFRESH_MAX_AGE)
  );
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
      return {
        userId: null,
        accessToken: null,
        userEmail: null,
        failure: 'unconfigured',
      };
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
