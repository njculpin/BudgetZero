/**
 * POST /api/products/[productId]/resolve-conflict
 * Mark a product conflict as resolved
 */

import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { resolveProductConflict } from "@/lib/data-access/notifications";

export const POST: APIRoute = async ({ params, cookies }) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authenticate user
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;

  // Resolve conflict
  const result = await resolveProductConflict(productId, userId);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error || "Failed to resolve conflict" }),
      {
        status: result.error === "Unauthorized" ? 403 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
