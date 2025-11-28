import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getSaleById, getSaleItems, getSaleItemAssets } from "@/lib/data-access/sales";
import { getAssetFiles } from "@/lib/data-access/assets";
import { createSignedUrl } from "@/lib/storage/uploads";

/**
 * Asset Download Endpoint
 * Generates time-limited signed download URLs for purchased assets
 *
 * Security:
 * - Verifies user authentication
 * - Confirms user owns the sale
 * - Confirms asset is part of the purchased sale
 *
 * URL Pattern: /api/purchases/[saleId]/download/[assetId]
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  const { saleId, assetId } = params;

  if (!saleId || !assetId) {
    return new Response(JSON.stringify({ error: "Missing saleId or assetId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Authenticate user
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
    // 2. Verify user owns this sale
    const sale = await getSaleById(saleId);
    if (!sale) {
      return new Response(JSON.stringify({ error: "Sale not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (sale.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized - you do not own this sale" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify sale is paid
    if (sale.status !== "paid") {
      return new Response(JSON.stringify({ error: "Sale not paid" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Verify asset is part of this sale
    const saleItems = await getSaleItems(saleId);
    if (!saleItems || saleItems.length === 0) {
      return new Response(JSON.stringify({ error: "No items found in this sale" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all sale item assets for this sale
    const allSaleItemAssets = await Promise.all(
      saleItems.map(item => getSaleItemAssets(item.id))
    );

    const saleItemAssets = allSaleItemAssets.flat();

    // Check if asset is in this sale
    const assetInSale = saleItemAssets.find(sia => sia.asset_id === assetId);
    if (!assetInSale) {
      return new Response(JSON.stringify({ error: "Asset not found in this sale" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Get asset files
    const assetFiles = await getAssetFiles(assetId);
    if (!assetFiles || assetFiles.length === 0) {
      return new Response(JSON.stringify({ error: "No files found for this asset" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Generate signed URLs for all files (24 hour expiry)
    const signedUrls = await Promise.all(
      assetFiles.map(async (file) => {
        const signedUrl = await createSignedUrl(
          "asset-files",
          file.storage_path,
          86400 // 24 hours in seconds
        );

        return {
          fileId: file.id,
          title: file.title,
          description: file.description,
          mimeType: file.mime_type,
          sizeBytes: file.file_size_bytes,
          downloadUrl: signedUrl,
          expiresIn: "24 hours",
        };
      })
    );

    // Filter out any failed URL generations
    const validUrls = signedUrls.filter(url => url.downloadUrl !== null);

    if (validUrls.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to generate download URLs" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return signed URLs
    return new Response(
      JSON.stringify({
        assetId,
        saleId,
        files: validUrls,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Download endpoint error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate download URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
