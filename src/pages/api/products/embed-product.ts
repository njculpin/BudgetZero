import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { serverClient } from "@/lib/data-access/client";
import { z } from "zod";

const embedSchema = z.object({
  parentProductId: z.string().uuid(),
  childProductId: z.string().uuid(),
  inheritedPriceCents: z.number().int().min(0),
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
    const validatedData = embedSchema.parse(body);

    // Check that parent product belongs to user
    const { data: parentProduct, error: parentError } = await serverClient
      .from("products")
      .select("id, user_id")
      .eq("id", validatedData.parentProductId)
      .eq("deleted", false)
      .single();

    if (parentError || !parentProduct) {
      return new Response(JSON.stringify({ error: "Parent product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (parentProduct.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check that child product exists and is accessible
    const { data: childProduct, error: childError } = await serverClient
      .from("products")
      .select("id, status, user_id, is_embeddable")
      .eq("id", validatedData.childProductId)
      .eq("deleted", false)
      .single();

    if (childError || !childProduct) {
      return new Response(JSON.stringify({ error: "Child product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if product is marked as embeddable
    if (!childProduct.is_embeddable) {
      return new Response(
        JSON.stringify({ error: "This product is not available for embedding" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to embed this product
    // Can embed if: product is public OR user owns it
    if (childProduct.status !== "public" && childProduct.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You don't have access to embed this product" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prevent embedding a product into itself
    if (validatedData.parentProductId === validatedData.childProductId) {
      return new Response(
        JSON.stringify({ error: "Cannot embed a product into itself" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if already embedded
    // TODO: Move to data access layer
    const { data: existing } = await serverClient
      .from("product_components")
      .select("id")
      .eq("parent_product_id", validatedData.parentProductId)
      .eq("child_product_id", validatedData.childProductId)
      .eq("deleted", false)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This product is already embedded" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create product_component record
    const { data: component, error: componentError } = await serverClient
      .from("product_components")
      .insert({
        parent_product_id: validatedData.parentProductId,
        child_product_id: validatedData.childProductId,
        inherited_price_cents: validatedData.inheritedPriceCents,
      })
      .select()
      .single();

    if (componentError || !component) {
      console.error("Error creating product component:", componentError);
      return new Response(
        JSON.stringify({ error: "Failed to embed product" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, component }),
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

    console.error("Embed product error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to embed product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
