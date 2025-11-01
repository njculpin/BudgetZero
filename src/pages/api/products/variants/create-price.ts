import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import { createVariantPrice } from "@/lib/data-access/products";

const createPriceSchema = z.object({
  variantId: z.string().uuid(),
  currency: z.string().length(3),
  unitAmount: z.number().int().min(0),
  minQuantity: z.number().int().min(1).default(1),
  maxQuantity: z.number().int().min(1).optional(),
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

  try {
    const body = await request.json();
    const validatedData = createPriceSchema.parse(body);

    const price = await createVariantPrice(validatedData.variantId, {
      currency: validatedData.currency,
      unitAmount: validatedData.unitAmount,
      minQuantity: validatedData.minQuantity,
      maxQuantity: validatedData.maxQuantity,
    });

    if (!price) {
      return new Response(JSON.stringify({ error: "Failed to create price" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        price,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create price error:", error);

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

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return new Response(
        JSON.stringify({
          error: "A price already exists for this quantity. Please edit or delete the existing price, or use a different minimum quantity.",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to create price",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
