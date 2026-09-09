import { defineMiddleware } from "astro:middleware";
import { setSession } from "@/lib/auth";

/**
 * Routes that require authentication.
 *
 * Prefixes here are the outer gate; individual routes still perform their own
 * ownership checks. Anything under /api that is not listed in PUBLIC_API_ROUTES
 * below is covered by the catch-all "/api" entry, so a newly added route is
 * protected by default rather than exposed by omission.
 */
const PROTECTED_ROUTES = [
  "/payouts",
  "/connect/dashboard",
  "/api",
];

/**
 * API routes that are public (no auth required).
 *
 * `/api/webhooks/stripe` is authenticated by Stripe signature rather than by
 * session. The search endpoints back anonymous browsing.
 *
 * Note that public pages render product data server-side through the data-access
 * layer rather than by calling /api/products, so no anonymous browsing depends on
 * those routes. If a public island ever needs one, add it here explicitly.
 */
const PUBLIC_API_ROUTES = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/sign-out",
  "/api/auth/callback",
  "/api/auth/reset-password",
  "/api/auth/update-password",
  "/api/webhooks/stripe",
  "/api/subscribe",
  "/api/tags/suggestions",
  "/api/users/search-users",
  "/api/products/search-products",
];

/**
 * Check if a path requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  // Check if it's explicitly a public API route
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return false;
  }

  // Check if it matches any protected route pattern
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;

  // Skip auth check for public routes
  if (!isProtectedRoute(pathname)) {
    return next();
  }

  // Special handling for webhook routes (verified by Stripe signature, not session)
  if (pathname.startsWith("/api/webhooks/")) {
    return next();
  }

  // Get auth cookies
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  // If no tokens, redirect to sign-in
  if (!accessToken || !refreshToken) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For page routes, redirect to sign-in
    return redirect("/sign-in");
  }

  // Verify session
  try {
    const session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      // Clear invalid cookies
      cookies.delete("sb-access-token", { path: "/" });
      cookies.delete("sb-refresh-token", { path: "/" });

      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return new Response(
          JSON.stringify({ error: "Invalid session" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // For page routes, redirect to sign-in
      return redirect("/sign-in");
    }

    // Attach user info to locals for use in routes. Supabase's User/Session carry
    // index signatures that do not structurally match App.Locals, so narrow to the
    // fields routes actually read.
    locals.user = { ...session.data.user, id: session.data.user.id };
    locals.session = session.data.session
      ? { ...session.data.session, access_token: session.data.session.access_token }
      : undefined;

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    // Clear cookies on error
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    // For API routes, return 500
    if (pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For page routes, redirect to sign-in
    return redirect("/sign-in");
  }
});
