import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { serverClient } from "@/lib/data-access/client";
import { z } from "zod";

const unembedSchema = z.object({
  componentId: z.string().uuid(),
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
    const validatedData = unembedSchema.parse(body);

    // Fetch the component to verify ownership
    const { data: component, error: componentError } = await serverClient
      .from("product_components")
      .select(`
        id,
        parent_product_id,
        products!parent_product_id (
          user_id
        )
      `)
      .eq("id", validatedData.componentId)
      .eq("deleted", false)
      .single();

    if (componentError || !component) {
      return new Response(JSON.stringify({ error: "Component not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parentProduct = component.products as any;
    if (parentProduct.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Soft delete the component
    const { error: deleteError } = await serverClient
      .from("product_components")
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", validatedData.componentId);

    if (deleteError) {
      console.error("Error deleting product component:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to remove embedded product" }),
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

    console.error("Unembed product error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to remove embedded product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
