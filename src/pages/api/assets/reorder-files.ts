import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { reorderAssetFiles, getAssetById } from "@/lib/data-access/assets";
import { z } from "zod";

const reorderSchema = z.object({
  assetId: z.string().uuid(),
  fileOrders: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
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
    const validatedData = reorderSchema.parse(body);

    // Verify user owns the asset
    const asset = await getAssetById(validatedData.assetId);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Reorder files
    const success = await reorderAssetFiles(validatedData.fileOrders);

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to reorder files" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Reorder files error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to reorder files",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
