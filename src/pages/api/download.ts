import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { hasUserPurchasedAsset } from "@/lib/data-access/sales";
import { getAssetFileById } from "@/lib/data-access/assets";
import { createSignedDownloadUrl } from "@/lib/storage";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return redirect("/sign-in?redirect=/downloads");
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return redirect("/sign-in?redirect=/downloads");
    }
  } catch (error) {
    return redirect("/sign-in?redirect=/downloads");
  }

  const userId = session.data.user.id;

  // Get form data
  const formData = await request.formData();
  const fileId = formData.get("file_id") as string;
  const assetId = formData.get("asset_id") as string;

  if (!fileId || !assetId) {
    return new Response("Missing file_id or asset_id", { status: 400 });
  }

  try {
    // Check if user has purchased this asset
    const hasPurchased = await hasUserPurchasedAsset(userId, assetId);

    if (!hasPurchased) {
      return new Response("You have not purchased this asset", { status: 403 });
    }

    // Get file details
    const file = await getAssetFileById(fileId);

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    // Create signed download URL (expires in 1 hour)
    const signedUrl = await createSignedDownloadUrl(
      'asset-files',
      file.storage_path,
      3600
    );

    if (!signedUrl) {
      return new Response("Failed to create download URL", { status: 500 });
    }

    // Redirect to the signed URL
    return redirect(signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return new Response(
      "Failed to process download",
      { status: 500 }
    );
  }
};
