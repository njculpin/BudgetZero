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

  if (!jamId || !productId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify the user owns the product
  const { data: product, error: productError } = await serverClient
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", user.id)
    .eq("deleted", false)
    .single();

  if (productError || !product) {
    return new Response(
      JSON.stringify({ error: "Product not found or you don't own it" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Verify the jam is active
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

  if (jam.status !== "active") {
    return new Response(
      JSON.stringify({ error: "Jam is not currently active" }),
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
