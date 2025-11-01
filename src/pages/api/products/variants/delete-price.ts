import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import { serverClient } from "@/lib/data-access/client";
import { getVariantById } from "@/lib/data-access/products";

const deletePriceSchema = z.object({
  priceId: z.string().uuid(),
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
    const validatedData = deletePriceSchema.parse(body);

    // Get the price to verify ownership through variant
    const { data: price, error: priceError } = await serverClient
      .from("product_variant_prices")
      .select("variant_id")
      .eq("id", validatedData.priceId)
      .single();

    if (priceError || !price) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify ownership through variant > product
    const variant = await getVariantById(price.variant_id);
    if (!variant) {
      return new Response(JSON.stringify({ error: "Variant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: product, error: productError } = await serverClient
      .from("products")
      .select("user_id")
      .eq("id", variant.product_id)
      .single();

    if (productError || !product || product.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the price
    const { error: deleteError } = await serverClient
      .from("product_variant_prices")
      .delete()
      .eq("id", validatedData.priceId);

    if (deleteError) {
      console.error("Error deleting price:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete price" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Delete price error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to delete price",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
