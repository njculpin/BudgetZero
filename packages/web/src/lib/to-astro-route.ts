import type { APIRoute, APIContext, AstroCookies } from 'astro';
import type { CookieJar, CookieOptions, Controller } from '@gameloopers/api/context';
import { resolveAuth } from '@gameloopers/api/gateway';

/**
 * Mount a transport-agnostic controller as an Astro API route.
 *
 * This is the only file in the application that knows both Astro's request
 * objects and the controller contract. Everything a controller needs is built
 * here; running the same controllers under Hono, Bun or a worker means writing
 * another file like this one, and changing no controller.
 */

/** Adapt `AstroCookies` to the narrow jar controllers are given. */
function toCookieJar(cookies: AstroCookies): CookieJar {
  return {
    get: (name) => cookies.get(name)?.value,
    set: (name, value, options?: CookieOptions) => cookies.set(name, value, options),
    delete: (name, options) => cookies.delete(name, options),
  };
}

export function toAstroRoute(controller: Controller): APIRoute {
  return async (context: APIContext): Promise<Response> => {
    const cookies = toCookieJar(context.cookies);

    // Identity is established once, here, and handed to the controller. A
    // controller never reaches for the session itself.
    const { userId, accessToken, userEmail, failure } = await resolveAuth(cookies);

    return controller({
      request: context.request,
      params: context.params,
      url: context.url,
      cookies,
      userId,
      accessToken,
      userEmail,
      // Astro resolves this from the adapter's forwarding headers.
      clientAddress: context.clientAddress ?? null,
      authFailure: failure,
    });
  };
}
