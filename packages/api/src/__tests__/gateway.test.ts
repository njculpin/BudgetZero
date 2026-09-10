// @vitest-environment node
//
// jsdom supplies a TextEncoder from another realm, which breaks jose's key
// type check. See verify-token.test.ts.

/**
 * Gateway tests.
 *
 * These cover the authentication behaviour that used to be duplicated into every
 * route and asserted separately in every route's test file. It lives in one
 * place now, so it is tested in one place.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { resolveAuth, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../gateway';
import { fakeCookieJar } from '../test-support';
import * as session from '@gameloopers/core/auth/session';

vi.mock('@gameloopers/core/auth/session');

const SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
const USER_ID = '11111111-2222-3333-4444-555555555555';
const now = () => Math.floor(Date.now() / 1000);

async function token(exp: number, sub: string = USER_ID, email = 'nick@example.com') {
  return new SignJWT({ sub, role: 'authenticated', email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(SECRET));
}

describe('resolveAuth', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
    vi.restoreAllMocks();
  });

  it('reports an anonymous caller when no cookies are presented', async () => {
    const result = await resolveAuth(fakeCookieJar());

    expect(result).toEqual({
      userId: null,
      accessToken: null,
      userEmail: null,
      failure: 'anonymous',
    });
    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it('accepts a valid access token without contacting the auth provider', async () => {
    const access = await token(now() + 3600);
    const result = await resolveAuth(
      fakeCookieJar({ [ACCESS_TOKEN_COOKIE]: access, [REFRESH_TOKEN_COOKIE]: 'r' })
    );

    expect(result.userId).toBe(USER_ID);
    expect(result.userEmail).toBe('nick@example.com');
    expect(result.failure).toBeNull();
    // The whole point: no round trip on the common path.
    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it('rejects a tampered token and clears the cookies', async () => {
    const access = await token(now() + 3600);
    const [header, , signature] = access.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: 'attacker', role: 'service_role', exp: now() + 3600 })
    ).toString('base64url');

    const jar = fakeCookieJar({
      [ACCESS_TOKEN_COOKIE]: `${header}.${forged}.${signature}`,
      [REFRESH_TOKEN_COOKIE]: 'r',
    });
    const result = await resolveAuth(jar);

    expect(result.userId).toBeNull();
    expect(result.failure).toBe('invalid');
    expect(jar.deleted).toContain(ACCESS_TOKEN_COOKIE);
    expect(jar.deleted).toContain(REFRESH_TOKEN_COOKIE);
    // A bad signature is not something a refresh can fix.
    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it('renews an expired session and writes the new pair back', async () => {
    vi.mocked(session.refreshSession).mockResolvedValue({
      userId: USER_ID,
      accessToken: await token(now() + 3600),
      refreshToken: 'new-refresh',
    });

    const jar = fakeCookieJar({
      [ACCESS_TOKEN_COOKIE]: await token(now() - 60),
      [REFRESH_TOKEN_COOKIE]: 'old-refresh',
    });
    const result = await resolveAuth(jar);

    expect(result.userId).toBe(USER_ID);
    expect(result.failure).toBeNull();
    expect(session.refreshSession).toHaveBeenCalledWith('old-refresh');
    expect(jar.store.get(REFRESH_TOKEN_COOKIE)).toBe('new-refresh');
    expect(jar.store.get(ACCESS_TOKEN_COOKIE)).not.toBe('old-refresh');
  });

  it('signs the caller out when the refresh token is exhausted', async () => {
    vi.mocked(session.refreshSession).mockResolvedValue(null);

    const jar = fakeCookieJar({
      [ACCESS_TOKEN_COOKIE]: await token(now() - 60),
      [REFRESH_TOKEN_COOKIE]: 'dead-refresh',
    });
    const result = await resolveAuth(jar);

    expect(result.userId).toBeNull();
    expect(result.failure).toBe('expired');
    expect(jar.deleted).toContain(ACCESS_TOKEN_COOKIE);
  });

  it('does not attempt a refresh when there is no refresh token', async () => {
    const jar = fakeCookieJar({ [ACCESS_TOKEN_COOKIE]: await token(now() - 60) });
    const result = await resolveAuth(jar);

    expect(result.failure).toBe('expired');
    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it('distinguishes a misconfigured server from a signed-out user', async () => {
    // No signing key available: this is a deployment fault, and reporting it as
    // "anonymous" would quietly sign out every user on the platform and look
    // like an auth bug rather than a missing environment variable.
    delete process.env.SUPABASE_JWT_SECRET;

    const jar = fakeCookieJar({
      [ACCESS_TOKEN_COOKIE]: await token(now() + 3600),
      [REFRESH_TOKEN_COOKIE]: 'r',
    });
    const result = await resolveAuth(jar);

    expect(result.failure).toBe('unconfigured');
    // Crucially, the session is NOT discarded over a server-side fault.
    expect(jar.deleted).toHaveLength(0);
  });

  it('refuses a signed token that identifies no user', async () => {
    // The anon and service_role keys are signed by the same secret. Accepting
    // one would authenticate a request as nobody in particular.
    const anon = await new SignJWT({ role: 'anon' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(now() + 3600)
      .sign(new TextEncoder().encode(SECRET));

    const result = await resolveAuth(
      fakeCookieJar({ [ACCESS_TOKEN_COOKIE]: anon, [REFRESH_TOKEN_COOKIE]: 'r' })
    );

    expect(result.userId).toBeNull();
    expect(result.failure).toBe('invalid');
  });
});
