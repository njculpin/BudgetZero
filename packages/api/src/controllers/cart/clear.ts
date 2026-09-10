import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getOrCreateCart, clearCart } from "@gameloopers/core/data-access/cart";

export const cartClear: Controller = async ({ request, userId }) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');

  try {
    // Get user's cart
    const cart = await getOrCreateCart(userId);

    if (!cart) {
      return new Response(JSON.stringify({ error: "Failed to get cart" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const success = await clearCart(cart.id);

    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to clear cart" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to clear cart",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
