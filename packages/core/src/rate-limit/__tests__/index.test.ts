/**
 * Rate Limiting Tests
 *
 * The limiter is a mitigation, not an authorization control, and that distinction
 * drives its behaviour: it fails OPEN. If the counter store is unreachable the
 * request proceeds, because a database blip must not take down sign-in.
 *
 * These tests pin that decision explicitly so it cannot be "fixed" into failing
 * closed by accident, and cover the identity rules that decide whose quota is
 * being spent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkRateLimit,
  rateLimitIdentity,
  rateLimitedResponse,
  RATE_LIMITS,
} from '../index';
import { serverClient } from '../../data-access/client';
import { mockRpcError, mockRpcSuccess } from '../../test/supabase-fixtures';

vi.mock('../../data-access/client', () => ({
  serverClient: { rpc: vi.fn() },
}));

const rule = RATE_LIMITS.signIn;

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows a request under the limit and reports what remains', async () => {
    vi.mocked(serverClient.rpc).mockResolvedValue(mockRpcSuccess(7));

    await expect(checkRateLimit(rule, 'ip:1.2.3.4')).resolves.toEqual({
      allowed: true,
      remaining: 7,
      retryAfterSeconds: 0,
    });
  });

  it('blocks once the limit is exhausted', async () => {
    // -1 is the function's signal that the quota is spent.
    vi.mocked(serverClient.rpc).mockResolvedValue(mockRpcSuccess(-1));

    const result = await checkRateLimit(rule, 'ip:1.2.3.4');

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(rule.windowSeconds);
  });

  it('allows the request when the store errors (fails open)', async () => {
    vi.mocked(serverClient.rpc).mockResolvedValue(
      mockRpcError('connection refused')
    );

    const result = await checkRateLimit(rule, 'ip:1.2.3.4');

    expect(result.allowed).toBe(true);
  });

  it('allows the request when the store throws (fails open)', async () => {
    vi.mocked(serverClient.rpc).mockRejectedValue(new Error('timeout'));

    await expect(checkRateLimit(rule, 'ip:1.2.3.4')).resolves.toMatchObject({
      allowed: true,
    });
  });

  it('namespaces the counter per rule so one route cannot exhaust another', async () => {
    vi.mocked(serverClient.rpc).mockResolvedValue(mockRpcSuccess(1));

    await checkRateLimit(RATE_LIMITS.upload, 'user:abc');

    expect(serverClient.rpc).toHaveBeenCalledWith('consume_rate_limit', {
      p_key: 'upload:user:abc',
      p_limit: RATE_LIMITS.upload.limit,
      p_window_seconds: RATE_LIMITS.upload.windowSeconds,
    });
  });
});

describe('rateLimitIdentity', () => {
  const bareRequest = () => new Request('http://localhost/api/auth/sign-in');

  it('prefers the user id, which survives IP rotation', () => {
    expect(rateLimitIdentity(bareRequest(), '1.2.3.4', 'user-1')).toBe(
      'user:user-1'
    );
  });

  it('falls back to the client address for anonymous callers', () => {
    expect(rateLimitIdentity(bareRequest(), '1.2.3.4')).toBe('ip:1.2.3.4');
  });

  it('takes the original client from an x-forwarded-for chain', () => {
    const request = new Request('http://localhost/api/auth/sign-in', {
      headers: { 'x-forwarded-for': '203.0.113.9, 70.41.3.18, 150.172.238.178' },
    });

    // Behind a proxy the first entry is the real client; using the last would
    // bucket every request behind one proxy address and limit nobody.
    expect(rateLimitIdentity(request, '10.0.0.1')).toBe('ip:203.0.113.9');
  });

  it('still produces a key when the address is unknown', () => {
    expect(rateLimitIdentity(bareRequest())).toBe('ip:unknown');
  });
});

describe('rateLimitedResponse', () => {
  it('is a 429 carrying Retry-After', async () => {
    const response = rateLimitedResponse({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 300,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('300');
    await expect(response.json()).resolves.toMatchObject({
      retryAfterSeconds: 300,
    });
  });
});
