import { serverClient } from './client';
import type { AssetStatus } from '@/types';

/**
 * Status Downgrade Validation
 *
 * Prevents unsafe status changes that could break other users' products.
 *
 * Business Rules:
 * - public → private: BLOCKED if asset is used in products owned by other users
 * - public → draft: BLOCKED if asset is used in products owned by other users
 * - public → archived: BLOCKED if asset is used in products owned by other users
 * - private → draft: ALLOWED (only affects owner's products)
 * - private → archived: ALLOWED (only affects owner's products)
 * - Any status → public: ALLOWED (makes asset more available, doesn't break anything)
 */

export interface StatusChangeValidation {
  allowed: boolean;
  reason?: string;
  affectedProducts?: Array<{
    id: string;
    title: string;
    owner_id: string;
  }>;
}

/**
 * Check if an asset status change is allowed
 */
export async function canChangeAssetStatus(
  assetId: string,
  currentStatus: AssetStatus,
  newStatus: AssetStatus,
  assetOwnerId: string
): Promise<StatusChangeValidation> {
  // Allow any status → public (makes asset more available)
  if (newStatus === 'public') {
    return { allowed: true };
  }

  // Allow same status (no change)
  if (currentStatus === newStatus) {
    return { allowed: true };
  }

  // Allow draft → anything (draft assets shouldn't be in products)
  if (currentStatus === 'draft') {
    return { allowed: true };
  }

  // Allow private → draft/archived (only affects owner's products)
  if (currentStatus === 'private' && (newStatus === 'draft' || newStatus === 'archived')) {
    return { allowed: true };
  }

  // CRITICAL CHECK: public → private/draft/archived
  // This is a downgrade that could break other users' products
  if (currentStatus === 'public' && (newStatus === 'private' || newStatus === 'draft' || newStatus === 'archived')) {
    // Check if asset is used in products owned by other users
    const { data: productAssets, error } = await serverClient
      .from('product_assets')
      .select(`
        product_variants!inner(
          product_id,
          products!inner(
            id,
            title,
            user_id
          )
        )
      `)
      .eq('asset_id', assetId);

    if (error) {
      console.error('Error checking asset usage:', error);
      return {
        allowed: false,
        reason: 'Failed to verify asset usage. Please try again.',
      };
    }

    // Extract unique products and filter out owner's products
    const productsUsingAsset = new Map<string, { id: string; title: string; owner_id: string }>();

    if (productAssets) {
      for (const pa of productAssets) {
        const variant = pa.product_variants as any;
        if (variant?.products) {
          const product = variant.products;
          // Only count products owned by OTHER users
          if (product.user_id !== assetOwnerId) {
            productsUsingAsset.set(product.id, {
              id: product.id,
              title: product.title,
              owner_id: product.user_id,
            });
          }
        }
      }
    }

    if (productsUsingAsset.size > 0) {
      const affectedProducts = Array.from(productsUsingAsset.values());
      return {
        allowed: false,
        reason: `Cannot change to ${newStatus} status. This public asset is currently used in ${affectedProducts.length} product(s) owned by other users. Changing the status would break their products.`,
        affectedProducts,
      };
    }

    // No other users' products affected - allow the change
    return { allowed: true };
  }

  // For any other status transition, allow it
  // (archived → anything, etc.)
  return { allowed: true };
}

/**
 * Get list of products using an asset
 */
export async function getProductsUsingAsset(assetId: string): Promise<Array<{
  productId: string;
  productTitle: string;
  ownerId: string;
  variantId: string;
  variantTitle: string;
}>> {
  const { data, error } = await serverClient
    .from('product_assets')
    .select(`
      variant_id,
      product_variants!inner(
        id,
        title,
        product_id,
        products!inner(
          id,
          title,
          user_id
        )
      )
    `)
    .eq('asset_id', assetId);

  if (error || !data) {
    console.error('Error fetching products using asset:', error);
    return [];
  }

  return data.map((pa) => {
    const variant = pa.product_variants as any;
    const product = variant.products;
    return {
      productId: product.id,
      productTitle: product.title,
      ownerId: product.user_id,
      variantId: variant.id,
      variantTitle: variant.title,
    };
  });
}
