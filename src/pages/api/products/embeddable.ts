/**
 * GET /api/products/embeddable
 * Fetches products that can be embedded as components
 */

import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { getEmbeddableProducts } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ cookies }) => {
  // Authenticate user
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await getSession(accessToken.value, refreshToken.value);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch embeddable products for this user
  const products = await getEmbeddableProducts(session.user.id);

  return new Response(
    JSON.stringify({
      products,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
