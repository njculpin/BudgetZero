import { serverClient } from '../data-access/client';

/**
 * Request rate limiting.
 *
 * Counters live in Postgres because Vercel gives each request its own serverless
 * invocation with no shared memory — an in-process counter would reset constantly
 * and enforce nothing.
 *
 * Limits are deliberately generous. The goal is to blunt credential stuffing and
 * upload floods, not to police normal use.
 */

export interface RateLimitRule {
  /** Distinguishes buckets so one route's traffic cannot exhaust another's. */
  name: string;
  /** Requests permitted per window. */
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  /** Sign-in is the credential-stuffing target. */
  signIn: { name: 'sign-in', limit: 10, windowSeconds: 300 },
  /** Account creation, to slow bulk registration. */
  signUp: { name: 'sign-up', limit: 5, windowSeconds: 3600 },
  /** Password reset sends email, so abuse costs real money and reputation. */
  passwordReset: { name: 'password-reset', limit: 5, windowSeconds: 3600 },
  /** Uploads are the most expensive authenticated action. */
  upload: { name: 'upload', limit: 60, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window; 0 once the limit is reached. */
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Identify the caller for rate-limiting purposes.
 *
 * Prefers the authenticated user id, which survives IP rotation. Falls back to the
 * client address for anonymous routes like sign-in, where there is no user yet.
 * `x-forwarded-for` may hold a chain; the first entry is the original client.
 */
export function rateLimitIdentity(
  request: Request,
  clientAddress?: string,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || clientAddress;

  return `ip:${ip || 'unknown'}`;
}

/**
 * Consume one unit of quota for `identity` under `rule`.
 *
 * Fails open: if the rate-limit store is unreachable, the request is allowed. A
 * database blip should not take down sign-in, and the counter is a mitigation
 * rather than an authorization control.
 */
export async function checkRateLimit(
  rule: RateLimitRule,
  identity: string
): Promise<RateLimitResult> {
  try {
    const { data, error } = await serverClient.rpc('consume_rate_limit', {
      p_key: `${rule.name}:${identity}`,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });

    if (error) {
      console.error(`Rate limit check failed for ${rule.name}:`, error);
      return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
    }

    const remaining = data as number;

    if (remaining < 0) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: rule.windowSeconds,
      };
    }

    return { allowed: true, remaining, retryAfterSeconds: 0 };
  } catch (error) {
    console.error(`Rate limit check threw for ${rule.name}:`, error);
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }
}

/**
 * Standard 429 for a caller who has exhausted their quota.
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please wait and try again.',
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  );
}
