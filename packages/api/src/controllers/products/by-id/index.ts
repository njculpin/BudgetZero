import type { Controller } from '../../../context';
import { getProductById } from "@gameloopers/core/data-access/products";
import { getUserById } from "@gameloopers/core/data-access/users";

export const productsProductId: Controller = async ({ request, params }) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const product = await getProductById(productId);

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch owner information
    const owner = await getUserById(product.user_id);

    return new Response(
      JSON.stringify({
        product,
        owner: owner
          ? {
              id: owner.id,
              handle: owner.handle,
              name: owner.name,
            }
          : null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
