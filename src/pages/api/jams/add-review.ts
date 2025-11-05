import type { APIRoute } from "astro";
import { getUser } from "@/lib/auth";
import { serverClient } from "@/lib/data-access/client";

export const POST: APIRoute = async ({ request, redirect }) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/sign-in");
  }

  const formData = await request.formData();
  const jamId = formData.get("jam_id") as string;
  const productId = formData.get("product_id") as string;
  const rating = parseInt(formData.get("rating") as string);
  const reviewText = formData.get("review_text") as string;

  if (!jamId || !productId || !rating || !reviewText) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: "Rating must be between 1 and 5" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify the jam exists
  const { data: jam, error: jamError } = await serverClient
    .from("jams")
    .select("handle")
    .eq("id", jamId)
    .eq("deleted", false)
    .single();

  if (jamError || !jam) {
    return new Response(JSON.stringify({ error: "Jam not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(
      JSON.stringify({ error: "Product is not submitted to this jam" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if user already reviewed this product in this jam
  const { data: existing } = await serverClient
    .from("jam_product_reviews")
    .select("*")
    .eq("jam_id", jamId)
    .eq("product_id", productId)
    .eq("user_id", user.id)
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
      return new Response(
        JSON.stringify({ error: "Failed to update review" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } else {
    // Create new review
    const { error: insertError } = await serverClient
      .from("jam_product_reviews")
      .insert({
        jam_id: jamId,
        product_id: productId,
        user_id: user.id,
        review_rating: rating,
        review_text: reviewText,
      });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to add review" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return redirect(`/jams/${jam.handle}`);
};
