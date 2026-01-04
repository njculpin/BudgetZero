import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getRecentProducts, getUserProducts } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.data.user.id;
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
