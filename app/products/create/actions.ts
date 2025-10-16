"use server";

import {
  addProductVariantAsset,
  createProduct,
  createProductPrice,
  createProductVariant,
} from "@/lib/sdk/server/products";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CreateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
}

export async function createProductAction(
  formData: FormData,
): Promise<CreateProductResult> {
  try {
    // Ensure user is authenticated (will redirect if not)
    await getMe();
    const supabase = await createClient();

    // Extract basic product info
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const handle = formData.get("handle") as string;

    // Extract variant and pricing info
    const variantName = formData.get("variant_name") as string;
    const priceCents = Number.parseInt(
      formData.get("price_cents") as string,
      10,
    );
    const assetIdsJson = formData.get("asset_ids") as string;
    const assetIds = JSON.parse(assetIdsJson) as string[];

    // Validate required fields
    if (!title || !handle || !variantName || !priceCents || !assetIds.length) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Create product
    const { data: product, error: productError } = await createProduct(
      supabase,
      {
        title,
        description,
        handle,
        status: "draft", // Start as draft
      },
    );

    if (productError || !product) {
      return {
        success: false,
        error: productError?.message || "Failed to create product",
      };
    }

    // Create default variant
    const { data: variant, error: variantError } = await createProductVariant(
      supabase,
      {
        product_id: product.id,
        title: variantName,
        sku: `${handle}-${variantName.toLowerCase().replace(/\s+/g, "-")}`,
      },
    );

    if (variantError || !variant) {
      // Cleanup: delete product if variant creation fails
      await supabase.from("products").delete().eq("id", product.id);
      return {
        success: false,
        error: variantError?.message || "Failed to create product variant",
      };
    }

    // Create price for variant
    const { error: priceError } = await createProductPrice(supabase, {
      variant_id: variant.id,
      price_cents: priceCents,
      currency: "USD",
    });

    if (priceError) {
      // Cleanup
      await supabase.from("products").delete().eq("id", product.id);
      return {
        success: false,
        error: priceError.message || "Failed to create product price",
      };
    }

    // Link assets to variant
    for (const assetId of assetIds) {
      await addProductVariantAsset(supabase, {
        variant_id: variant.id,
        asset_id: assetId,
      });
    }

    // Revalidate pages
    revalidatePath("/products");
    revalidatePath(`/products/${product.id}`);

    return { success: true, productId: product.id };
  } catch (error) {
    console.error("Create product error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}
