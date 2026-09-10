import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { hasUserPurchasedProduct } from "@/lib/data-access/sales";
import { getProductFileById } from "@/lib/data-access/products";
import { createSignedUrl } from "@/lib/storage";
import { captureError } from "@/lib/monitoring";

/** Signed download links are bearer credentials for paid content: 5 minutes is
 *  ample to start a download and short enough that a leaked link expires fast. */
const DOWNLOAD_URL_TTL_SECONDS = 300;

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

  if (!fileId) {
    return new Response("Missing file_id", { status: 400 });
  }

  try {
    // Get file details first. Entitlement is checked against the product this file
    // actually belongs to, never against a product id supplied by the caller — a
    // caller-supplied product id lets anyone pair a product they did buy with a file
    // from one they did not.
    const file = await getProductFileById(fileId);

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    // Check if user has purchased the product that owns this file. This also covers
    // files belonging to products embedded within something the user bought.
    const hasPurchased = await hasUserPurchasedProduct(userId, file.product_id);

    if (!hasPurchased) {
      return new Response("You have not purchased this product", { status: 403 });
    }

    // Create a short-lived signed download URL. The link is a bearer credential for
    // paid content, so it is scoped to long enough to complete a download and no
    // longer — not the 24 hours it previously carried.
    const signedUrl = await createSignedUrl(
      'product-files',
      file.storage_path,
      DOWNLOAD_URL_TTL_SECONDS
    );

    if (!signedUrl) {
      return new Response("Failed to create download URL", { status: 500 });
    }

    // Redirect to the signed URL
    return redirect(signedUrl);
  } catch (error) {
    captureError(error, { operation: 'download.signed_url', userId, fileId });
    return new Response(
      "Failed to process download",
      { status: 500 }
    );
  }
};
