import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getOrCreateCart, clearCart } from "@/lib/data-access/cart";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = session.data.user.id;

  try {
    // Get user's cart
    const cart = await getOrCreateCart(userId, {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    });

    if (!cart) {
      return new Response(
        JSON.stringify({ error: "Failed to get cart" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = await clearCart(cart.id, {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    });

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to clear cart" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
