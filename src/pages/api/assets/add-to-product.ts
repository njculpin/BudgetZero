import type { APIRoute } from "astro";
import { getUser } from "@/lib/auth";
import { getAssetById } from "@/lib/data-access/assets";
import { getAssetRoyalties } from "@/lib/data-access/royalties";
import {
  createProduct,
  getProductById,
  createVariant,
  linkAssetToVariant
} from "@/lib/data-access/products";

export const POST: APIRoute = async ({ request, cookies }) => {
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { assetId, productId, newProductTitle } = body;

    if (!assetId) {
      return new Response(JSON.stringify({ error: "Asset ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify asset ownership
    const asset = await getAssetById(assetId);
    if (!asset) {
      return new Response(JSON.stringify({ error: "Asset not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (asset.user_id !== currentUser.id) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    let targetProductId = productId;
    let targetProduct;

    // Create new product if requested
    if (!productId && newProductTitle) {
      const newProduct = await createProduct(currentUser.id, {
        title: newProductTitle,
        description: asset.description || "",
        status: asset.status as "draft" | "published" | "archived",
      });

      if (!newProduct) {
        return new Response(JSON.stringify({ error: "Failed to create product" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      targetProductId = newProduct.id;
      targetProduct = newProduct;
    } else if (productId) {
      // Verify product ownership
      targetProduct = await getProductById(productId);
      if (!targetProduct) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (targetProduct.user_id !== currentUser.id) {
        return new Response(JSON.stringify({ error: "Not authorized to modify this product" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Either productId or newProductTitle required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a default variant if it's a new product
    // For existing products, we'll link to the first variant or create one
    const variant = await createVariant(targetProductId, {
      title: "Standard",
      description: "Standard variant",
      sku: `${targetProduct.handle}-standard`,
      position: 0,
    });

    if (!variant) {
      return new Response(JSON.stringify({ error: "Failed to create variant" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Link asset to variant
    const linkSuccess = await linkAssetToVariant(variant.id, assetId);

    if (!linkSuccess) {
      return new Response(JSON.stringify({ error: "Failed to link asset to product" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // NOTE: Royalty propagation is handled at sale time, not at linking time.
    // When a sale is completed, the webhook automatically creates sale_royalty_transactions
    // for each asset based on the asset_royalties configuration.
    // This ensures royalties are always calculated with the current asset royalty settings.

    // NOTE: Licensing propagation could be implemented as a helper function that
    // aggregates all asset licenses for a product variant. This would allow
    // displaying combined licensing requirements without duplicating data.
    // Example: getVariantLicenses(variantId) -> aggregates licenses from all linked assets

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: targetProduct.id,
          handle: targetProduct.handle,
          title: targetProduct.title,
        },
        variant: {
          id: variant.id,
          title: variant.title,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error adding asset to product:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
