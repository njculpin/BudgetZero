import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getUserProducts, getProductVariants } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ cookies, params }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
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
      return new Response(JSON.stringify({ error: "Invalid session" }), {
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

  try {
    const userId = session.data.user.id;

    // Get all products for this user
    const products = await getUserProducts(userId);

    // For each product, fetch its variants
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await getProductVariants(product.id);
        return {
          ...product,
          variants,
        };
      })
    );

    return new Response(JSON.stringify({ products: productsWithVariants }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user products:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch products",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
