import type { APIRoute } from "astro";
import { getUser } from "@/lib/auth";
import { deleteAsset, getAssetById } from "@/lib/data-access/assets";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get auth tokens from cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { assetId } = await request.json();

    if (!assetId) {
      return new Response(JSON.stringify({ error: "Asset ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare auth tokens
    const authTokens = {
      accessToken,
      refreshToken,
    };

    // Verify ownership (pass auth tokens to see own drafts)
    const asset = await getAssetById(assetId, authTokens);
    if (!asset) {
      return new Response(JSON.stringify({ error: "Asset not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (asset.user_id !== currentUser.id) {
      return new Response(JSON.stringify({ error: "Not authorized to delete this asset" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Soft delete the asset
    const success = await deleteAsset(assetId, authTokens);

    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete asset" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
