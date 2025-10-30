import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { updateCartItemQuantity } from "@/lib/data-access/cart";
import { z } from "zod";

const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0), // 0 or less will remove the item
});

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

  try {
    const body = await request.json();
    const validatedData = updateCartItemSchema.parse(body);

    const success = await updateCartItemQuantity(
      validatedData.cartItemId,
      validatedData.quantity,
      {
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
      }
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to update cart item" }),
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
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Update cart item error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update cart item",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
