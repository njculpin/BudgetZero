import type { AstroCookies } from 'astro';
import { setSession } from './index';

/**
 * Resolve the signed-in user from request cookies.
 *
 * Every protected API route needs the same three steps — read the auth cookies,
 * exchange them for a session, pull the user id out — and each hand-rolled copy is a
 * chance to get it subtly wrong. The notifications routes, for instance, called
 * `getSession(accessToken, refreshToken)`; `getSession` takes no arguments and
 * returns `{ data: { session } }`, so their `session.user` check was always falsy and
 * every one of those endpoints answered 401 no matter who called it.
 *
 * Returns the user id on success, or `null` when the caller is not authenticated.
 * Use `unauthorizedResponse()` to render the matching failure.
 */
export async function requireUserId(
  cookies: AstroCookies
): Promise<string | null> {
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  try {
    const session = await setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

    if (session.error || !session.data.user) {
      return null;
    }

    return session.data.user.id;
  } catch {
    return null;
  }
}

/**
 * Standard 401 for an unauthenticated API caller.
 */
export function unauthorizedResponse(
  message = 'Unauthorized'
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
