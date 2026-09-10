import type { Controller } from '../../context';
import { searchProducts } from "@gameloopers/core/data-access/products";

/**
 * Search the caller's own products.
 *
 * This used to call `getUser()`, which reads the session from the shared
 * module-level auth client. On a server that client holds no session of its own,
 * so the check returned no user and the endpoint answered 401 to every caller —
 * the same failure the notifications routes had. Identity now arrives already
 * resolved on the context.
 *
 * Not a public route despite once being listed as one: `searchProducts` is
 * scoped to a single user's products.
 */
export const productsSearchProducts: Controller = async ({ userId, url }) => {
  const query = url.searchParams.get("q");

  if (!userId) {
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
    const products = await searchProducts(userId, query);

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
