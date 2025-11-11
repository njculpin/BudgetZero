import type { APIRoute } from "astro";
import { serverClient } from "@/lib/data-access/client";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Asset ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get all royalties for this asset
    const { data: royalties, error } = await serverClient
      .from("asset_royalties")
      .select("royalty_value")
      .eq("asset_id", id)
      .eq("deleted", false);

    if (error) {
      console.error("Error fetching asset royalties:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch royalties" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const total = royalties?.reduce((sum, r) => sum + r.royalty_value, 0) || 0;

    return new Response(JSON.stringify({ total }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calculating royalty total:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to calculate royalty total",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
