import type { APIRoute } from "astro";
import { serverClient } from "@/lib/data-access/client";

export const GET: APIRoute = async ({ request, url }) => {
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "User ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get all products owned by the user that are embeddable
    const { data: userProducts, error: userProductsError } = await serverClient
      .from("products")
      .select("id")
      .eq("owner_id", userId)
      .eq("is_embeddable", true)
      .eq("deleted", false);

    if (userProductsError) {
      console.error("Error fetching user products:", userProductsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user products" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userProducts || userProducts.length === 0) {
      return new Response(
        JSON.stringify({ parentProducts: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const userProductIds = userProducts.map((p: { id: string }) => p.id);

    // Find all parent products that embed the user's products
    const { data: components, error: componentsError } = await serverClient
      .from("product_components")
      .select(`
        parent_product_id,
        component_product_id,
        royalty_rate,
        products!product_components_parent_product_id_fkey (
          id,
          title,
          handle,
          cover_image_url,
          owner_id,
          users!products_owner_id_fkey (
            name,
            handle
          )
        )
      `)
      .in("component_product_id", userProductIds)
      .eq("deleted", false);

    if (componentsError) {
      console.error("Error fetching components:", componentsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch embedded products" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!components || components.length === 0) {
      return new Response(
        JSON.stringify({ parentProducts: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get sales data for each parent product
    // For each parent product, calculate total royalties earned
    const parentProductMap = new Map();

    for (const component of components) {
      const product = component.products;
      if (!product || !product.users) continue;

      const parentId = component.parent_product_id;

      if (!parentProductMap.has(parentId)) {
        parentProductMap.set(parentId, {
          id: product.id,
          title: product.title,
          handle: product.handle,
          cover_image_url: product.cover_image_url,
          owner_name: product.users.name,
          owner_handle: product.users.handle,
          royalty_rate: component.royalty_rate,
          total_earnings: 0,
          sales_count: 0,
        });
      }
    }

    // Fetch royalty transactions for these parent products
    const parentIds = Array.from(parentProductMap.keys());

    const { data: royalties, error: royaltiesError } = await serverClient
      .from("sale_royalty_transactions")
      .select("product_id, amount_cents")
      .in("product_id", parentIds)
      .eq("recipient_user_id", userId);

    if (royaltiesError) {
      console.error("Error fetching royalties:", royaltiesError);
    } else if (royalties) {
      // Aggregate royalties by parent product
      const royaltyMap = new Map<string, { total: number; count: number }>();

      for (const royalty of royalties) {
        const existing = royaltyMap.get(royalty.product_id) || { total: 0, count: 0 };
        existing.total += royalty.amount_cents;
        existing.count += 1;
        royaltyMap.set(royalty.product_id, existing);
      }

      // Update parent products with earnings
      for (const [productId, data] of royaltyMap.entries()) {
        const product = parentProductMap.get(productId);
        if (product) {
          product.total_earnings = data.total;
          product.sales_count = data.count;
        }
      }
    }

    const parentProducts = Array.from(parentProductMap.values());

    return new Response(
      JSON.stringify({ parentProducts }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in embedded-usage:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
