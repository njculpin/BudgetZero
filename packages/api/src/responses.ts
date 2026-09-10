/**
 * Response helpers.
 *
 * Routes previously hand-built `new Response(JSON.stringify(...), { status, headers })`
 * at every exit point, which is how three different spellings of the 401 body
 * ended up in the codebase. Naming them also means the shape of an error
 * response can change in one place.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function badRequest(error: string, details?: unknown): Response {
  return json(details === undefined ? { error } : { error, details }, 400);
}

export function unauthorized(error = 'Unauthorized'): Response {
  return json({ error }, 401);
}

export function forbidden(error = 'Forbidden'): Response {
  return json({ error }, 403);
}

export function notFound(error = 'Not found'): Response {
  return json({ error }, 404);
}

export function tooManyRequests(
  error = 'Too many requests',
  retryAfterSeconds?: number
): Response {
  return json(
    { error },
    429,
    retryAfterSeconds === undefined ? {} : { 'Retry-After': String(retryAfterSeconds) }
  );
}

export function serverError(error = 'Internal server error'): Response {
  return json({ error }, 500);
}

/**
 * A redirect built from the Web platform rather than a framework helper.
 *
 * Astro's `redirect()` is only available inside an Astro route; controllers need
 * something they can return from anywhere.
 */
export function redirect(
  location: string,
  status: 301 | 302 | 303 | 307 | 308 = 302
): Response {
  return new Response(null, { status, headers: { Location: location } });
}
