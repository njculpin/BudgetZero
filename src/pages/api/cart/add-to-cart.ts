import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getOrCreateCart, addToCart } from "@/lib/data-access/cart";
import { getProductById } from "@/lib/data-access/products";
import { z } from "zod";

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export const POST: APIRoute = async ({ request, cookies }) => {
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

  const userId = session.data.user.id;

  try {
    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);

    // Validate product exists and can be purchased
    const product = await getProductById(validatedData.productId);
    if (!product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate product status - only private and public products can be purchased
    if (product.status !== 'private' && product.status !== 'public') {
      return new Response(
        JSON.stringify({
          error: `This product cannot be purchased. Only products with status "private" or "public" can be added to cart. Current status: ${product.status}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get or create cart for user
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return new Response(JSON.stringify({ error: "Failed to get cart" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add product to cart
    const cartItem = await addToCart(
      cart.id,
      validatedData.productId,
      validatedData.quantity
    );

    if (!cartItem) {
      return new Response(
        JSON.stringify({ error: "Failed to add product to cart" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, cartItem }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to add to cart",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
