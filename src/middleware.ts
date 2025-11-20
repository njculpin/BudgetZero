import { defineMiddleware } from "astro:middleware";
import { setSession } from "@/lib/auth";

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/payouts",
  "/connect/dashboard",
  "/api/assets",
  "/api/products",
  "/api/payouts",
  "/api/connect",
  "/api/cart",
  "/api/webhooks", // Protected but verified differently (Stripe signature)
];

/**
 * API routes that are public (no auth required)
 */
const PUBLIC_API_ROUTES = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/sign-out",
  "/api/auth/callback",
  "/api/webhooks/stripe",
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

    // Attach user info to locals for use in routes
    locals.user = session.data.user;
    locals.session = session.data.session;

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
