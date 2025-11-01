import type { APIRoute } from "astro";
import { getUser } from "@/lib/auth";
import { searchProducts } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ url, cookies }) => {
  const query = url.searchParams.get("q");

  // Check authentication
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!query) {
    return new Response(JSON.stringify({ error: "Query parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const products = await searchProducts(currentUser.id, query);

    return new Response(
      JSON.stringify({
        products: products.map((product) => ({
          id: product.id,
          handle: product.handle,
          title: product.title,
          status: product.status,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error searching products:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
