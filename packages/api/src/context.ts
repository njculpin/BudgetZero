/**
 * The request shape controllers are written against.
 *
 * Controllers used to be Astro `APIRoute` handlers, which meant they took
 * Astro's `AstroCookies` and its `redirect()` helper. That tied every one of them
 * to the framework: the same logic could not be mounted under Hono, a Bun server,
 * or a background worker without a rewrite.
 *
 * Everything here is either a Web platform type (`Request`, `Response`) or a
 * small interface this package owns. Mounting the controllers somewhere new is
 * then a matter of writing one adapter that builds a `RequestContext`, rather
 * than touching any controller.
 */

/**
 * Cookie access that does not depend on a framework.
 *
 * Deliberately narrow: read, write, delete. Astro, Hono and a plain Node server
 * can all satisfy it, and a controller cannot reach for anything framework
 * specific through it.
 */
export interface CookieJar {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string, options?: Pick<CookieOptions, 'path'>): void;
}

export interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  domain?: string;
}

/**
 * Everything a controller is given.
 *
 * `userId` is resolved once, by the gateway, before any controller runs. That is
 * the point of it: previously the middleware exchanged the session cookies for a
 * user and then each route did the identical exchange again, so every
 * authenticated request paid for two round trips to the auth provider before it
 * started doing its own work.
 */
export interface RequestContext {
  request: Request;
  /** Dynamic route segments, e.g. `{ productId: '...' }`. Empty for static routes. */
  params: Readonly<Record<string, string | undefined>>;
  url: URL;
  cookies: CookieJar;
  /** The authenticated caller, or `null` for an anonymous request. */
  userId: string | null;
  /**
   * The caller's verified access token, when there is one.
   *
   * A few operations have to act *as the user* rather than as the service role —
   * storage uploads written under the user's own prefix, so the bucket policies
   * that scope a path to `auth.uid()` still apply. Those need the token itself,
   * not just the id behind it.
   *
   * Only ever set from a token that has already been verified, so a controller
   * never has to wonder whether it can be trusted.
   */
  accessToken: string | null;
  /** The caller's email, from the verified token. Used when creating Stripe customers. */
  userEmail: string | null;
  /**
   * The client's IP address, or `null` when the runtime cannot determine one.
   *
   * Needed by the rate limiter: `rateLimitIdentity()` keys on it for anonymous
   * callers, which is the case that most needs limiting. Every runtime spells
   * this differently — Astro exposes `clientAddress`, a bare Node server reads a
   * forwarding header — so the adapter supplies it and controllers stay portable.
   */
  clientAddress: string | null;
  /**
   * Why `userId` is null, when it is. Lets a controller distinguish "signed out"
   * from "your session expired and could not be renewed", which are different
   * messages to show a user.
   */
  authFailure: AuthFailure | null;
}

export type AuthFailure =
  /** No auth cookies were presented at all. */
  | 'anonymous'
  /** Cookies were present but the token did not verify. */
  | 'invalid'
  /** The token had expired and the refresh attempt did not succeed. */
  | 'expired'
  /** The server is misconfigured — no signing key available to verify against. */
  | 'unconfigured';

/**
 * A controller: one request in, one response out.
 *
 * Returning a `Response` rather than mutating a framework object is what keeps
 * these testable without a server — a unit test constructs a `RequestContext`
 * and asserts on the returned `Response`.
 */
export type Controller = (ctx: RequestContext) => Promise<Response>;
