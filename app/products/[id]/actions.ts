"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import {
  addProductVariantAsset,
  createProductTags,
  deleteProductTags,
  getProductByIdWithDetails,
  getProductVariantAssets,
  removeProductVariantAsset,
  softDeleteProduct,
  updateProduct,
  updateProductPrice,
  updateProductVariant,
} from "@/lib/sdk/server/products";
import { getMe } from "@/lib/sdk/server/users";
import { createServiceClient } from "@/lib/supabase/service";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

interface CreateCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

export async function createCheckoutSession(
  productId: string,
): Promise<CreateCheckoutResult> {
  try {
    const user = await getMe();

    // Get product details
    const { data: product, error: productError } =
      await getProductByIdWithDetails(productId);

    if (productError || !product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Get the first variant and its price
    const variant = product.product_variants?.[0];
    if (!variant) {
      return {
        success: false,
        error: "Product has no variants",
      };
    }

    const price = variant.product_variant_prices?.[0];
    if (!price) {
      return {
        success: false,
        error: "Product has no price",
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: price.currency.toLowerCase(),
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.product_images
                ?.slice(0, 1)
                .map((img: { file_url: string }) => img.file_url),
            },
            unit_amount: price.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}`,
      metadata: {
        user_id: user.id,
        product_id: productId,
        variant_id: variant.id.toString(),
      },
      customer_email: user.email,
    });

    if (!session.url) {
      return {
        success: false,
        error: "Failed to create checkout session",
      };
    }

    return {
      success: true,
      checkoutUrl: session.url,
    };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create checkout",
    };
  }
}

interface UpdateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
}

export async function updateProductAction(
  productId: string,
  formData: FormData,
): Promise<UpdateProductResult> {
  try {
    console.log("[UPDATE PRODUCT] Starting...");
    const user = await getMe();
    console.log("[UPDATE PRODUCT] User authenticated:", user.id);

    const supabase = createServiceClient();

    // Extract form data
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const handle = formData.get("handle") as string;
    const variantName = formData.get("variant_name") as string;
    const priceCents = Number.parseInt(
      formData.get("price_cents") as string,
      10,
    );
    const assetIdsJson = formData.get("asset_ids") as string;
    const assetIds = JSON.parse(assetIdsJson) as string[];
    const tagsJson = formData.get("tags") as string;
    const tags = tagsJson ? (JSON.parse(tagsJson) as string[]) : [];

    // Validate required fields
    if (!title || !handle || !variantName || !priceCents || !assetIds.length) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Update product
    console.log("[UPDATE PRODUCT] Updating product:", {
      productId,
      title,
      handle,
    });
    const { data: product, error: productError } = await updateProduct(
      supabase,
      productId,
      {
        title,
        description,
        handle,
      },
    );

    if (productError || !product) {
      console.error("[UPDATE PRODUCT] Failed to update product:", productError);

      // Check for duplicate handle error
      const error = productError as { code?: string; message?: string };
      if (
        error?.code === "23505" &&
        error?.message?.includes("products_handle_key")
      ) {
        return {
          success: false,
          error: `A product with the handle "${handle}" already exists. Please choose a different handle.`,
        };
      }

      return {
        success: false,
        error: error?.message || "Failed to update product",
      };
    }

    // Get existing product data to find variant
    const { data: existingProduct } =
      await getProductByIdWithDetails(productId);
    console.log(
      "[UPDATE PRODUCT] Existing product data:",
      JSON.stringify(existingProduct, null, 2),
    );
    const existingVariant = existingProduct?.product_variants?.[0];

    if (!existingVariant) {
      console.error("[UPDATE PRODUCT] No variant found in product");
      return {
        success: false,
        error: "Product variant not found",
      };
    }

    console.log(
      "[UPDATE PRODUCT] Existing variant:",
      existingVariant.id,
      "Prices:",
      existingVariant.product_variant_prices,
    );

    // Update variant
    const { error: variantError } = await updateProductVariant(
      supabase,
      existingVariant.id,
      {
        title: variantName,
      },
    );

    if (variantError) {
      console.error("[UPDATE PRODUCT] Failed to update variant:", variantError);
      return {
        success: false,
        error: variantError.message || "Failed to update product variant",
      };
    }

    // Update price
    const existingPrice = existingVariant.product_variant_prices?.[0];
    console.log(
      "[UPDATE PRODUCT] Existing price:",
      existingPrice,
      "New price:",
      priceCents,
    );
    if (existingPrice) {
      console.log(
        "[UPDATE PRODUCT] Updating price ID:",
        existingPrice.id,
        "to",
        priceCents,
      );
      const { error: priceError } = await updateProductPrice(
        supabase,
        existingPrice.id,
        {
          price_cents: priceCents,
        },
      );

      if (priceError) {
        console.error("[UPDATE PRODUCT] Failed to update price:", priceError);
        return {
          success: false,
          error: priceError.message || "Failed to update product price",
        };
      }
      console.log("[UPDATE PRODUCT] Price updated successfully");
    } else {
      console.error("[UPDATE PRODUCT] No existing price found to update");
    }

    // Update variant assets
    // Get current assets
    const { data: currentAssets } = await getProductVariantAssets(
      supabase,
      existingVariant.id,
    );

    const currentAssetIds = (currentAssets || []).map((a) => a.asset_id);

    // Remove assets that are no longer selected
    const assetsToRemove = (currentAssets || []).filter(
      (a) => !assetIds.includes(a.asset_id),
    );
    for (const asset of assetsToRemove) {
      await removeProductVariantAsset(supabase, asset.id);
    }

    // Add new assets
    const assetsToAdd = assetIds.filter((id) => !currentAssetIds.includes(id));
    for (const assetId of assetsToAdd) {
      await addProductVariantAsset(supabase, {
        variant_id: existingVariant.id,
        asset_id: assetId,
      });
    }

    // Update tags
    // First delete existing tags
    await deleteProductTags(supabase, productId);

    // Then add new tags
    if (tags.length > 0) {
      const tagRecords = tags.map((tag) => ({
        product_id: productId,
        namespace: "general",
        value: tag.toLowerCase().trim(),
      }));

      const { error: tagsError } = await createProductTags(
        supabase,
        tagRecords,
      );

      if (tagsError) {
        console.error("Failed to update tags:", tagsError);
        // Don't fail the whole operation for tags
      }
    }

    // Revalidate pages
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return { success: true, productId };
  } catch (error) {
    console.error("Update product error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

interface DeleteProductResult {
  success: boolean;
  error?: string;
}

export async function deleteProductAction(
  productId: string,
): Promise<DeleteProductResult> {
  try {
    console.log("[DELETE PRODUCT] Starting...", productId);
    const user = await getMe();
    console.log("[DELETE PRODUCT] User authenticated:", user.id);

    const supabase = createServiceClient();

    // Soft delete the product using SDK
    const { error: deleteError } = await softDeleteProduct(supabase, productId);

    if (deleteError) {
      console.error("[DELETE PRODUCT] Failed:", deleteError);
      return {
        success: false,
        error: deleteError.message || "Failed to delete product",
      };
    }

    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("[DELETE PRODUCT] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
