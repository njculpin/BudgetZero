import { jwtVerify, createRemoteJWKSet, decodeProtectedHeader } from 'jose';
import type { JWTPayload, JWTVerifyGetKey } from 'jose';
import { readEnv } from '../env';

/**
 * Local verification of Supabase access tokens.
 *
 * Every protected request used to call `supabase.auth.setSession()`, which makes
 * a network round trip to `/auth/v1/user` whenever the token has not expired.
 * The middleware did it once and the route did it again, so an authenticated API
 * call cost two round trips to Supabase Auth before any of its own work started.
 *
 * A Supabase access token is a signed JWT. Checking the signature ourselves needs
 * no network at all, which is what makes resolving the caller once at the gateway
 * cheap enough to do on every request. The network is still used for the one case
 * that genuinely needs it — swapping an expired token for a fresh one — which
 * happens about once an hour per session rather than twice per request.
 *
 * Two signing schemes are supported because Supabase has both:
 *
 *  - **HS256 with a shared secret.** Used by local development and by projects
 *    created before asymmetric keys existed. Configure `SUPABASE_JWT_SECRET`.
 *  - **Asymmetric (RS256/ES256) with a published JWKS.** The default for new
 *    projects. Nothing to configure; the key set is fetched from the project's
 *    well-known endpoint and cached by `jose` across requests.
 *
 * The scheme is chosen from the token's own `alg` header, and the algorithm is
 * then pinned when verifying. That ordering matters: passing an attacker's `alg`
 * straight to the verifier is the classic algorithm-confusion bug, where a token
 * signed with the *public* key as an HMAC secret is accepted as genuine. Pinning
 * to the specific algorithm family, and never verifying an HMAC token against
 * JWKS material, closes it.
 */

/** The subset of an access token's claims that the application actually uses. */
export interface VerifiedToken {
  userId: string;
  role: string;
  email?: string;
  /** Unix seconds. */
  expiresAt: number;
}

export type VerifyFailure =
  /** Signature and shape were fine, but the token is past its expiry — refresh it. */
  | 'expired'
  /** Malformed, wrong signature, missing `sub`, or an algorithm we refuse. */
  | 'invalid'
  /** Neither a JWT secret nor a Supabase URL is configured — a deployment error. */
  | 'unconfigured';

export type VerifyResult =
  { ok: true; token: VerifiedToken } | { ok: false; reason: VerifyFailure };

/** Algorithms we will verify. `none` and anything unlisted is rejected outright. */
const SYMMETRIC_ALGS = ['HS256'] as const;
const ASYMMETRIC_ALGS = ['RS256', 'ES256'] as const;

/**
 * `createRemoteJWKSet` caches the fetched key set and refreshes it on its own
 * schedule, so this is built once per process rather than per request. Building
 * it per request would reintroduce exactly the network cost being removed.
 */
let cachedJwks: JWTVerifyGetKey | undefined;
let cachedJwksUrl: string | undefined;

function getJwks(supabaseUrl: string): JWTVerifyGetKey {
  // An injected test key set is authoritative; without this the URL comparison
  // below rebuilds a *remote* set and the test silently hits the network.
  if (cachedJwksUrl === '__test__' && cachedJwks) return cachedJwks;

  const url = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
  if (!cachedJwks || cachedJwksUrl !== url) {
    cachedJwks = createRemoteJWKSet(new URL(url));
    cachedJwksUrl = url;
  }
  return cachedJwks;
}

/** Test seam: point verification at a key set without a live Supabase. */
export function __setJwksForTesting(jwks: JWTVerifyGetKey | undefined): void {
  cachedJwks = jwks;
  cachedJwksUrl = jwks ? '__test__' : undefined;
}

function toVerifiedToken(payload: JWTPayload): VerifyResult {
  // A token without a subject identifies nobody. Supabase always sets it for a
  // user token; the anon and service keys do not have one, and must never be
  // mistaken for a signed-in user.
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    return { ok: false, reason: 'invalid' };
  }

  return {
    ok: true,
    token: {
      userId: payload.sub,
      role: typeof payload.role === 'string' ? payload.role : 'authenticated',
      email: typeof payload.email === 'string' ? payload.email : undefined,
      expiresAt: typeof payload.exp === 'number' ? payload.exp : 0,
    },
  };
}

/**
 * Verify an access token without contacting Supabase.
 *
 * Returns `{ ok: false, reason: 'expired' }` for a well-formed token that has
 * simply aged out — the caller should attempt a refresh rather than treating the
 * request as unauthenticated.
 */
export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: 'invalid' };

  let alg: string | undefined;
  try {
    alg = decodeProtectedHeader(token).alg;
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const isSymmetric = (SYMMETRIC_ALGS as readonly string[]).includes(alg ?? '');
  const isAsymmetric = (ASYMMETRIC_ALGS as readonly string[]).includes(alg ?? '');
  if (!isSymmetric && !isAsymmetric) return { ok: false, reason: 'invalid' };

  try {
    if (isSymmetric) {
      const secret = readEnv('SUPABASE_JWT_SECRET');
      if (!secret) return { ok: false, reason: 'unconfigured' };

      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
        algorithms: [...SYMMETRIC_ALGS],
      });
      return toVerifiedToken(payload);
    }

    const supabaseUrl = readEnv('PUBLIC_SUPABASE_URL');
    if (!supabaseUrl && cachedJwksUrl !== '__test__') {
      return { ok: false, reason: 'unconfigured' };
    }

    const { payload } = await jwtVerify(token, getJwks(supabaseUrl ?? ''), {
      algorithms: [...ASYMMETRIC_ALGS],
    });
    return toVerifiedToken(payload);
  } catch (error) {
    // `jose` reports an expired-but-otherwise-valid token distinctly, and that
    // distinction is the whole point: it is the difference between "refresh this"
    // and "reject this".
    const code = (error as { code?: string }).code;
    if (code === 'ERR_JWT_EXPIRED') return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'invalid' };
  }
}
