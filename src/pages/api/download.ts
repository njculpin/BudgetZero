import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { hasUserPurchasedProduct } from "@/lib/data-access/sales";
import { getProductFileById } from "@/lib/data-access/products";
import { createSignedUrl } from "@/lib/storage";

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
  const productId = formData.get("product_id") as string;

  if (!fileId || !productId) {
    return new Response("Missing file_id or product_id", { status: 400 });
  }

  try {
    // Check if user has purchased this product
    const hasPurchased = await hasUserPurchasedProduct(userId, productId);

    if (!hasPurchased) {
      return new Response("You have not purchased this product", { status: 403 });
    }

    // Get file details
    const file = await getProductFileById(fileId);

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    // Create signed download URL (expires in 24 hours)
    const signedUrl = await createSignedUrl(
      'product-files',
      file.storage_path,
      86400
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
