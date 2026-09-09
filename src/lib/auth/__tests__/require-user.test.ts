/**
 * requireUserId Tests
 *
 * Seven API routes depend on this helper. It exists because each hand-rolled copy
 * of the cookie-exchange dance was a chance to get it wrong — the notifications
 * routes called `getSession(accessToken, refreshToken)`, but `getSession` takes no
 * arguments and returns `{ data: { session } }`, so their `session.user` check was
 * always falsy and every endpoint answered 401 to every caller.
 *
 * These tests pin both halves of the contract: a valid session yields the user id,
 * and every failure mode yields null rather than a partially-trusted result.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireUserId, unauthorizedResponse } from '../require-user';
import * as auth from '../index';
import { mockAuthError, mockSession, mockUser } from '@/test/supabase-fixtures';

vi.mock('../index');

const USER_ID = 'user-123';

function cookiesWith(values: Record<string, string>) {
  return {
    get: vi.fn((name: string) =>
      name in values ? { value: values[name] } : undefined
    ),
  } as unknown as Parameters<typeof requireUserId>[0];
}

const validCookies = () =>
  cookiesWith({
    'sb-access-token': 'access',
    'sb-refresh-token': 'refresh',
  });

describe('requireUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the user id for a valid session', async () => {
    vi.mocked(auth.setSession).mockResolvedValue({
      data: { user: mockUser({ id: USER_ID }), session: mockSession() },
      error: null,
    });

    await expect(requireUserId(validCookies())).resolves.toBe(USER_ID);
  });

  it('exchanges both cookies for the session', async () => {
    vi.mocked(auth.setSession).mockResolvedValue({
      data: { user: mockUser({ id: USER_ID }), session: mockSession() },
      error: null,
    });

    await requireUserId(validCookies());

    // setSession takes an object, not positional arguments. Getting this wrong is
    // precisely the bug this helper was introduced to stop repeating.
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    });
  });

  it('returns null when the access token is missing', async () => {
    const cookies = cookiesWith({ 'sb-refresh-token': 'refresh' });

    await expect(requireUserId(cookies)).resolves.toBeNull();
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it('returns null when the refresh token is missing', async () => {
    const cookies = cookiesWith({ 'sb-access-token': 'access' });

    await expect(requireUserId(cookies)).resolves.toBeNull();
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it('returns null when the session is rejected', async () => {
    vi.mocked(auth.setSession).mockResolvedValue({
      data: { user: null, session: null },
      error: mockAuthError('Invalid refresh token'),
    });

    await expect(requireUserId(validCookies())).resolves.toBeNull();
  });

  it('returns null when a session comes back without a user', async () => {
    vi.mocked(auth.setSession).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    await expect(requireUserId(validCookies())).resolves.toBeNull();
  });

  it('returns null instead of propagating a thrown error', async () => {
    vi.mocked(auth.setSession).mockRejectedValue(new Error('network down'));

    // An auth outage must read as "not signed in", never crash the route.
    await expect(requireUserId(validCookies())).resolves.toBeNull();
  });
});

describe('unauthorizedResponse', () => {
  it('is a JSON 401', async () => {
    const response = unauthorizedResponse();

    expect(response.status).toBe(401);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });
});
