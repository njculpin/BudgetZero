/**
 * GET /api/products/embedded-usage
 *
 * Lists the products that embed the caller's components, and what the caller has
 * earned from each.
 */

import type { APIRoute } from "astro";
import { requireUserId, unauthorizedResponse } from "@/lib/auth/require-user";
import { getEmbeddedUsageForUser } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ cookies }) => {
  // Earnings are private financial data. This previously read the user id straight
  // from a query parameter, which let anyone read anyone else's royalty income — so
  // the caller is now always the session user.
  const userId = await requireUserId(cookies);

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const parentProducts = await getEmbeddedUsageForUser(userId);

    return new Response(
      JSON.stringify({ parentProducts }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in embedded-usage:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
