import type { CookieJar, CookieOptions, RequestContext } from './context';

/**
 * Building a `RequestContext` for tests.
 *
 * Route tests used to construct a fake Astro context and mock `setSession` so the
 * route's own auth block would resolve to a user — every test file repeating the
 * same setup, and each one asserting the same four authentication cases against
 * the same duplicated code.
 *
 * Identity now arrives already resolved, so a controller test says who is calling
 * and moves on. The authentication behaviour itself is tested once, against the
 * gateway.
 */

/** An in-memory cookie jar that records writes, so a test can assert on them. */
export function fakeCookieJar(initial: Record<string, string> = {}): CookieJar & {
  readonly store: Map<string, string>;
  readonly deleted: string[];
} {
  const store = new Map(Object.entries(initial));
  const deleted: string[] = [];

  return {
    store,
    deleted,
    get: (name) => store.get(name),
    set: (name, value, _options?: CookieOptions) => {
      store.set(name, value);
    },
    delete: (name) => {
      store.delete(name);
      deleted.push(name);
    },
  };
}

export interface ContextOverrides {
  /** Supply a fully-built Request instead of having one constructed. */
  request?: Request;
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | undefined>;
  userId?: string | null;
  accessToken?: string | null;
  userEmail?: string | null;
  clientAddress?: string | null;
  cookies?: CookieJar;
}

export function makeContext(overrides: ContextOverrides = {}): RequestContext {
  const url = overrides.url ?? 'http://localhost/api/test';
  const method = overrides.method ?? (overrides.body === undefined ? 'GET' : 'POST');

  const headers: Record<string, string> = { ...overrides.headers };
  if (overrides.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const request =
    overrides.request ??
    new Request(url, {
      method,
      headers,
      body: overrides.body === undefined ? undefined : JSON.stringify(overrides.body),
    });

  const userId = overrides.userId === undefined ? 'user-123' : overrides.userId;

  return {
    request,
    params: overrides.params ?? {},
    url: new URL(overrides.request?.url ?? url),
    cookies: overrides.cookies ?? fakeCookieJar(),
    userId,
    accessToken:
      overrides.accessToken === undefined
        ? (userId === null ? null : 'test-access-token')
        : overrides.accessToken,
    userEmail:
      overrides.userEmail === undefined
        ? (userId === null ? null : 'user@example.com')
        : overrides.userEmail,
    clientAddress: overrides.clientAddress ?? '203.0.113.1',
    authFailure: userId === null ? 'anonymous' : null,
  };
}
