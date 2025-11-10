import type { APIRoute } from "astro";
import { getAvailableAssetsForUser } from "@/lib/data-access/products";
import { getAssetImages } from "@/lib/data-access/assets";

export const GET: APIRoute = async ({ params }) => {
  const userId = params.userId;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "User ID is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const assets = await getAvailableAssetsForUser(userId);

    // Enrich each asset with cover image URL
    const assetsWithImages = await Promise.all(
      assets.map(async (asset) => {
        const images = await getAssetImages(asset.id);
        const coverImage = images[0]?.file_url || null;

        return {
          ...asset,
          cover_image_url: coverImage,
        };
      })
    );

    return new Response(
      JSON.stringify({ assets: assetsWithImages }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching available assets:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch assets",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
