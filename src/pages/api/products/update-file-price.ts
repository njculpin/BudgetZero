import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { updateProductFilePrice } from "@/lib/data-access/products";
import { serverClient } from "@/lib/data-access/client";
import { z } from "zod";

const updatePriceSchema = z.object({
  fileId: z.string().uuid(),
  priceCents: z.number().int().min(0),
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
    const validatedData = updatePriceSchema.parse(body);

    // Verify the user owns the product this file belongs to
    const { data: file, error: fetchError } = await serverClient
      .from("product_files")
      .select("product_id, products(user_id)")
      .eq("id", validatedData.fileId)
      .single();

    if (fetchError || !file) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productUserId = (file.products as { user_id: string })?.user_id;

    if (productUserId !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the price
    const success = await updateProductFilePrice(
      validatedData.fileId,
      validatedData.priceCents
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to update file price" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
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

    console.error("Update file price error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update file price",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
