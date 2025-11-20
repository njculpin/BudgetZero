import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { serverClient } from "@/lib/data-access/client";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check authentication
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');

  if (!accessToken || !refreshToken) {
    return redirect("/sign-in");
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return redirect("/sign-in");
    }
  } catch (error) {
    return redirect("/sign-in");
  }

  const userId = session.data.user.id;

  const formData = await request.formData();
  const jamId = formData.get("jam_id") as string;
  const productId = formData.get("product_id") as string;
  const rating = parseInt(formData.get("rating") as string);
  const reviewText = formData.get("review_text") as string;

  // Get product handle and owner for validation
  const { data: product } = await serverClient
    .from("products")
    .select("handle, user_id")
    .eq("id", productId)
    .single();

  const productHandle = product?.handle || "";

  if (!jamId || !productId || !rating || !reviewText) {
    return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent("Missing required fields")}`);
  }

  if (rating < 1 || rating > 5) {
    return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent("Rating must be between 1 and 5")}`);
  }

  // Verify the jam exists
  const { data: jam, error: jamError } = await serverClient
    .from("jams")
    .select("handle")
    .eq("id", jamId)
    .eq("deleted", false)
    .single();

  if (jamError || !jam) {
    return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent("Jam not found")}`);
  }

  // Verify product is submitted to this jam
  const { data: jamProduct } = await serverClient
    .from("jam_products")
    .select("*")
    .eq("jam_id", jamId)
    .eq("product_id", productId)
    .eq("deleted", false)
    .single();

  if (!jamProduct) {
    return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent("Product is not submitted to this jam")}`);
  }

  // Check if user owns the product (prevent self-reviews)
  if (product && product.user_id === userId) {
    return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent("You cannot review your own product")}`);
  }

  // Check if user already reviewed this product in this jam
  const { data: existing } = await serverClient
    .from("jam_product_reviews")
    .select("*")
    .eq("jam_id", jamId)
    .eq("product_id", productId)
    .eq("user_id", userId)
    .eq("deleted", false)
    .single();

  if (existing) {
    // Update existing review
    const { error: updateError } = await serverClient
      .from("jam_product_reviews")
      .update({
        review_rating: rating,
        review_text: reviewText,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Error updating review:", updateError);
      return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent(`Failed to update review: ${updateError.message}`)}`);
    }

    return redirect(`/products/${productHandle}?jam=${jamId}&review_success=${encodeURIComponent("Review updated successfully!")}`);
  } else {
    // Create new review
    const { error: insertError } = await serverClient
      .from("jam_product_reviews")
      .insert({
        jam_id: jamId,
        product_id: productId,
        user_id: userId,
        review_rating: rating,
        review_text: reviewText,
      });

    if (insertError) {
      console.error("Error inserting review:", insertError);
      return redirect(`/products/${productHandle}?jam=${jamId}&error=${encodeURIComponent(`Failed to add review: ${insertError.message}`)}`);
    }

    return redirect(`/products/${productHandle}?jam=${jamId}&review_success=${encodeURIComponent("Review submitted successfully!")}`);
  }
};
