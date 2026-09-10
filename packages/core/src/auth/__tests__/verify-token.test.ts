// @vitest-environment node
//
// Pinned to node rather than the suite-wide jsdom. jsdom supplies its own
// TextEncoder from a separate realm, so the Uint8Array it produces fails jose's
// `instanceof` check and every HS256 signature throws "Received an instance of
// Uint8Array". Astro SSR runs on Node, so jsdom is the wrong environment for
// crypto in the first place.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import { verifyAccessToken, __setJwksForTesting } from '../verify-token';

const SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
const secretKey = new TextEncoder().encode(SECRET);
const USER_ID = '11111111-2222-3333-4444-555555555555';

const now = () => Math.floor(Date.now() / 1000);

async function hs256(claims: Record<string, unknown>, exp = now() + 3600) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .sign(secretKey);
}

describe('verifyAccessToken - HS256 (local Supabase, shared secret)', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
    __setJwksForTesting(undefined);
  });

  it('accepts a valid token and extracts the claims the app uses', async () => {
    const token = await hs256({
      sub: USER_ID,
      role: 'authenticated',
      email: 'nick@example.com',
    });

    const result = await verifyAccessToken(token);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.token.userId).toBe(USER_ID);
    expect(result.token.role).toBe('authenticated');
    expect(result.token.email).toBe('nick@example.com');
    expect(result.token.expiresAt).toBeGreaterThan(now());
  });

  it('verifies without any network call', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls++;
      return originalFetch(...args);
    }) as typeof fetch;

    try {
      const token = await hs256({ sub: USER_ID, role: 'authenticated' });
      const result = await verifyAccessToken(token);
      expect(result.ok).toBe(true);
      expect(fetchCalls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('reports an aged-out token as expired, not invalid, so the caller refreshes', async () => {
    const token = await hs256({ sub: USER_ID, role: 'authenticated' }, now() - 60);

    const result = await verifyAccessToken(token);

    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = await new SignJWT({ sub: USER_ID, role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(now() + 3600)
      .sign(new TextEncoder().encode('a-different-secret-of-at-least-32-chars'));

    expect(await verifyAccessToken(token)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a token whose payload was tampered with after signing', async () => {
    const token = await hs256({ sub: USER_ID, role: 'authenticated' });
    const [header, , signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: USER_ID, role: 'service_role', exp: now() + 3600 })
    ).toString('base64url');

    const result = await verifyAccessToken(header + '.' + forged + '.' + signature);

    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects an unsigned "alg: none" token', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
      'base64url'
    );
    const payload = Buffer.from(
      JSON.stringify({ sub: USER_ID, role: 'service_role', exp: now() + 3600 })
    ).toString('base64url');

    expect(await verifyAccessToken(header + '.' + payload + '.')).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejects a validly signed token that carries no subject', async () => {
    // This is the shape of the anon and service_role keys. They are signed by the
    // same secret and would otherwise verify cleanly - but they identify no user,
    // so accepting one would authenticate a request as nobody.
    const token = await hs256({ role: 'anon' });

    expect(await verifyAccessToken(token)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('reports missing configuration distinctly from a bad token', async () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const token = await hs256({ sub: USER_ID, role: 'authenticated' });

    expect(await verifyAccessToken(token)).toEqual({ ok: false, reason: 'unconfigured' });
  });

  it('rejects garbage that is not a JWT at all', async () => {
    for (const junk of ['', 'not-a-jwt', 'a.b', 'a.b.c.d']) {
      expect(await verifyAccessToken(junk)).toEqual({ ok: false, reason: 'invalid' });
    }
  });
});

describe('verifyAccessToken - asymmetric (hosted Supabase, JWKS)', () => {
  let privateKey: CryptoKey;

  beforeEach(async () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const pair = await generateKeyPair('ES256', { extractable: true });
    privateKey = pair.privateKey;
    const publicJwk = await exportJWK(pair.publicKey);
    publicJwk.kid = 'test-key';
    publicJwk.alg = 'ES256';
    const jwks: JWTVerifyGetKey = createLocalJWKSet({ keys: [publicJwk] });
    __setJwksForTesting(jwks);
  });

  afterEach(() => {
    __setJwksForTesting(undefined);
  });

  it('accepts a token signed by a key in the published set', async () => {
    const token = await new SignJWT({ sub: USER_ID, role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setExpirationTime(now() + 3600)
      .sign(privateKey);

    const result = await verifyAccessToken(token);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.token.userId).toBe(USER_ID);
  });

  it('rejects a token signed by a key outside the published set', async () => {
    const pair = await generateKeyPair('ES256', { extractable: true });
    const token = await new SignJWT({ sub: USER_ID, role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setExpirationTime(now() + 3600)
      .sign(pair.privateKey);

    expect(await verifyAccessToken(token)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('will not verify an HMAC token against JWKS material', async () => {
    // Algorithm confusion: an attacker signs HS256 using public key material as
    // the secret, hoping the verifier picks the algorithm from the header and
    // validates it against the published key. An HMAC token must never be routed
    // to the JWKS path, so with no shared secret configured this is refused
    // rather than falling through.
    const token = await new SignJWT({ sub: USER_ID, role: 'service_role' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(now() + 3600)
      .sign(new TextEncoder().encode('public-key-material-masquerading-as-secret'));

    const result = await verifyAccessToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unconfigured');
  });

  it('rejects an asymmetric token that is not signed by a published key, even when a shared secret is also configured', async () => {
    // The genuine cross-scheme case: both verification paths are available at
    // once. A token must be checked against the key material for its OWN
    // algorithm, so an attacker-signed ES256 token cannot be smuggled through by
    // the presence of a symmetric secret.
    process.env.SUPABASE_JWT_SECRET = SECRET;
    try {
      const pair = await generateKeyPair('ES256', { extractable: true });
      const token = await new SignJWT({ sub: USER_ID, role: 'service_role' })
        .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
        .setExpirationTime(now() + 3600)
        .sign(pair.privateKey);

      expect(await verifyAccessToken(token)).toEqual({ ok: false, reason: 'invalid' });
    } finally {
      delete process.env.SUPABASE_JWT_SECRET;
    }
  });

  it('still distinguishes expiry on the asymmetric path', async () => {
    const token = await new SignJWT({ sub: USER_ID, role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setExpirationTime(now() - 60)
      .sign(privateKey);

    expect(await verifyAccessToken(token)).toEqual({ ok: false, reason: 'expired' });
  });
});
