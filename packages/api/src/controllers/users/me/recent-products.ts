import type { Controller } from '../../../context';
import { unauthorized } from '../../../responses';
import { getRecentProducts, getUserProducts } from "@gameloopers/core/data-access/products";

export const usersMeRecentProducts: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "3", 10);

    // Fetch recent products
    const recentProducts = await getRecentProducts(userId, limit);
    const allProducts = await getUserProducts(userId);

    return new Response(
      JSON.stringify({
        products: recentProducts,
        totalCount: allProducts.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching recent products:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch products",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
