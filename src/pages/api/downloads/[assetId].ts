import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { hasUserPurchasedAsset } from "@/lib/data-access/sales";
import { serverClient } from "@/lib/data-access/client";
import { createSignedDownloadUrl } from "@/lib/storage/assets";

export const GET: APIRoute = async ({ params, cookies }) => {
  const assetId = params.assetId;

  if (!assetId) {
    return new Response(JSON.stringify({ error: "Asset ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
    // Check if user has purchased this asset
    const hasPurchased = await hasUserPurchasedAsset(userId, assetId);

    if (!hasPurchased) {
      return new Response(
        JSON.stringify({ error: "You have not purchased this asset" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get asset files
    const { data: assetFiles, error: filesError } = await serverClient
      .from("asset_files")
      .select("id, title, description, storage_path, file_size_bytes, mime_type")
      .eq("asset_id", assetId)
      .eq("deleted", false)
      .order("position", { ascending: true });

    if (filesError) {
      console.error("Error fetching asset files:", filesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch asset files" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!assetFiles || assetFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files found for this asset" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create signed URLs for each file (valid for 1 hour)
    const filesWithUrls = await Promise.all(
      assetFiles.map(async (file) => {
        const signedUrl = await createSignedDownloadUrl(
          "asset-files",
          file.storage_path,
          3600 // 1 hour
        );

        return {
          id: file.id,
          title: file.title,
          description: file.description,
          size_bytes: file.file_size_bytes,
          mime_type: file.mime_type,
          download_url: signedUrl,
        };
      })
    );

    return new Response(
      JSON.stringify({
        asset_id: assetId,
        files: filesWithUrls,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Download error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Download failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
