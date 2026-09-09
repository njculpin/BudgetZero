/**
 * GET /api/products/embeddable
 * Fetches products that can be embedded as components
 */

import type { APIRoute } from "astro";
import { requireUserId, unauthorizedResponse } from "@/lib/auth/require-user";
import { getEmbeddableProducts } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ cookies }) => {
  // Authenticate user
  const userId = await requireUserId(cookies);

  if (!userId) {
    return unauthorizedResponse();
  }

  // Fetch embeddable products for this user
  const products = await getEmbeddableProducts(userId);

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
