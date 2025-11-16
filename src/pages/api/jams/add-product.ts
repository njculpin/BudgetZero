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

  if (!jamId || !productId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify the product exists
  const { data: product, error: productError } = await serverClient
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("deleted", false)
    .single();

  if (productError || !product) {
    return new Response(
      JSON.stringify({ error: "Product not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Verify the user owns the product
  if (product.user_id !== userId) {
    return new Response(
      JSON.stringify({ error: "You don't own this product" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Verify the product is published
  if (product.status !== "published") {
    return new Response(
      JSON.stringify({ error: "Only published products can be submitted to jams" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Verify the jam exists and is active (based on dates)
  const { data: jam, error: jamError } = await serverClient
    .from("jams")
    .select("*")
    .eq("id", jamId)
    .eq("deleted", false)
    .single();

  if (jamError || !jam) {
    return new Response(JSON.stringify({ error: "Jam not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if jam is active based on dates (not status field)
  const now = new Date();
  const startDate = new Date(jam.start_date);
  const endDate = new Date(jam.end_date);
  const isActive = now >= startDate && now <= endDate;

  if (!isActive) {
    const isUpcoming = now < startDate;
    const message = isUpcoming
      ? `Submissions open on ${startDate.toLocaleDateString()}`
      : `Submissions closed on ${endDate.toLocaleDateString()}`;

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if product is already submitted
  const { data: existing } = await serverClient
    .from("jam_products")
    .select("*")
    .eq("jam_id", jamId)
    .eq("product_id", productId)
    .eq("deleted", false)
    .single();

  if (existing) {
    return new Response(
      JSON.stringify({ error: "Product already submitted to this jam" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Add product to jam
  const { error: insertError } = await serverClient
    .from("jam_products")
    .insert({
      jam_id: jamId,
      product_id: productId,
    });

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Failed to add product to jam" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return redirect(`/jams/${jam.handle}`);
};
