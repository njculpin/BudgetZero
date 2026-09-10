import type { APIRoute, APIContext, AstroCookies } from 'astro';
import type { CookieJar, CookieOptions } from '@gameloopers/api/context';
import { resolveAuth } from '@gameloopers/api/gateway';
import { createRouter } from '@gameloopers/api/router';
import { routes } from '@gameloopers/api/routes';

/**
 * The whole API surface, mounted at one place.
 *
 * This replaces 68 files under this directory whose entire content was four
 * lines: an import and a `toAstroRoute` call. Their real content was their
 * *path* — the route existed because the file sat where it sat — which meant the
 * API's shape was expressed as a directory tree inside the web package rather
 * than as data next to the controllers.
 *
 * Only `ALL` is exported. Astro dispatches to a named export matching the
 * request method and falls back to `ALL` for anything unmatched, so exporting
 * `ALL` alone routes every verb here and lets the table decide what is allowed.
 *
 * What is given up: Astro no longer knows the route list at build time, so a
 * typo in `routes.ts` is a 404 at runtime rather than a missing-file error.
 * `routes.test.ts` covers that instead — every controller reachable, every path
 * resolving to the controller it names.
 *
 * What is gained: mounting this API under Hono, Bun or a worker is another file
 * like this one, over the same table.
 */

const router = createRouter(routes);

function toCookieJar(cookies: AstroCookies): CookieJar {
  return {
    get: (name) => cookies.get(name)?.value,
    set: (name, value, options?: CookieOptions) => cookies.set(name, value, options),
    delete: (name, options) => cookies.delete(name, options),
  };
}

function jsonError(error: string, status: number, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * The path below `/api`, always with a leading slash and no trailing one.
 *
 * A rest parameter captures the segments without a leading slash, and is
 * `undefined` when it matches nothing (a bare `/api` request), so both are
 * normalised here rather than in the router.
 */
export function pathFromParams(captured: string | undefined): string {
  const trimmed = (captured ?? '').replace(/^\/+/, '').replace(/\/+$/, '');
  return `/${trimmed}`;
}

export const ALL: APIRoute = async (context: APIContext): Promise<Response> => {
  const pathname = pathFromParams(context.params.path);
  const result = router.match(context.request.method, pathname);

  if (result.kind === 'not-found') {
    return jsonError('Not found', 404);
  }

  if (result.kind === 'method-not-allowed') {
    // Worth distinguishing from a 404: it tells a caller the endpoint is real
    // and they used the wrong verb.
    return jsonError(`Method ${context.request.method} not allowed`, 405, {
      Allow: result.allowed.join(', '),
    });
  }

  const { route, params } = result.match;
  const cookies = toCookieJar(context.cookies);

  // Identity is resolved once, here, for every route — including public ones,
  // where knowing the caller is optional but still useful.
  const { userId, accessToken, userEmail, failure } = await resolveAuth(cookies);

  // The gate that used to be a hand-maintained path list in middleware.ts. A
  // route is protected unless it says otherwise, so a new one is safe by
  // default and the requirement sits beside the controller.
  if (!route.public && !userId) {
    if (failure === 'unconfigured') {
      console.error('Auth is not configured: no signing key available.');
      return jsonError('Authentication unavailable', 503);
    }
    return jsonError('Unauthorized', 401);
  }

  return route.controller({
    request: context.request,
    params,
    url: context.url,
    cookies,
    userId,
    accessToken,
    userEmail,
    clientAddress: context.clientAddress ?? null,
    authFailure: failure,
  });
};
