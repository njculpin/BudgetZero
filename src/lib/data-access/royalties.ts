import { serverClient } from './client';
import type { ProductRoyalty, SaleRoyaltyTransaction, RoyaltyType } from '@/types';

export interface CreateRoyaltyParams {
  productId: string;
  userId: string;
  royaltyValue: number; // Flat rate in cents
}

/**
 * Get all royalties for a product
 */
export const getProductRoyalties = async (productId: string): Promise<ProductRoyalty[]> => {
  const { data, error } = await serverClient
    .from('product_royalties')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching product royalties:', error);
    return [];
  }

  return data as ProductRoyalty[];
};

/**
 * Backward compatibility: Get all royalties for an asset (now treated as product)
 * @deprecated Use getProductRoyalties instead
 */
export const getAssetRoyalties = getProductRoyalties;

/**
 * Get a specific royalty by ID
 */
export const getRoyaltyById = async (royaltyId: string): Promise<ProductRoyalty | null> => {
  const { data, error } = await serverClient
    .from('product_royalties')
    .select('*')
    .eq('id', royaltyId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as ProductRoyalty;
};

/**
 * Create a new royalty for a product
 */
export const createProductRoyalty = async (
  params: CreateRoyaltyParams
): Promise<ProductRoyalty | null> => {
  const { data, error } = await serverClient
    .from('product_royalties')
    .insert({
      product_id: params.productId,
      user_id: params.userId,
      royalty_type: 'fixed',
      royalty_value: params.royaltyValue,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product royalty:', error);
    return null;
  }

  return data as ProductRoyalty;
};

/**
 * Backward compatibility: Create a new royalty for an asset (now treated as product)
 * @deprecated Use createProductRoyalty instead
 */
export const createAssetRoyalty = createProductRoyalty;

/**
 * Update an existing royalty
 */
export const updateProductRoyalty = async (
  royaltyId: string,
  royaltyValue: number
): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_royalties')
    .update({
      royalty_value: royaltyValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error updating product royalty:', error);
    return false;
  }

  return true;
};

/**
 * Backward compatibility: Update an existing asset royalty (now treated as product)
 * @deprecated Use updateProductRoyalty instead
 */
export const updateAssetRoyalty = updateProductRoyalty;

/**
 * Delete a royalty (soft delete)
 */
export const deleteProductRoyalty = async (
  royaltyId: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_royalties')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error deleting product royalty:', error);
    return false;
  }

  return true;
};

/**
 * Backward compatibility: Delete an asset royalty (now treated as product)
 * @deprecated Use deleteProductRoyalty instead
 */
export const deleteAssetRoyalty = deleteProductRoyalty;

/**
 * Calculate total flat rate cost for a product
 * Returns the sum of all royalty flat rates in cents
 */
export const calculateTotalProductCost = async (
  productId: string
): Promise<number> => {
  const royalties = await getProductRoyalties(productId);
  return royalties.reduce((total, royalty) => total + royalty.royalty_value, 0);
};

/**
 * Backward compatibility: Calculate total flat rate cost for an asset (now treated as product)
 * @deprecated Use calculateTotalProductCost instead
 */
export const calculateTotalAssetCost = calculateTotalProductCost;

/**
 * Get all royalty transactions for a user (earnings)
 */
export async function getUserRoyaltyTransactions(
  userId: string
): Promise<SaleRoyaltyTransaction[]> {
  const { data, error } = await serverClient
    .from("sale_royalty_transactions")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching royalty transactions:", error);
    return [];
  }

  return data || [];
}

/**
 * Get earnings summary for a user
 */
export async function getUserEarningsSummary(userId: string): Promise<{
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  transactionCount: number;
}> {
  const transactions = await getUserRoyaltyTransactions(userId);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const totalEarnings = transactions.reduce(
    (sum, t) => sum + t.calculated_cents,
    0
  );

  const thisMonthEarnings = transactions
    .filter((t) => new Date(t.created_at) >= thisMonthStart)
    .reduce((sum, t) => sum + t.calculated_cents, 0);

  const lastMonthEarnings = transactions
    .filter(
      (t) =>
        new Date(t.created_at) >= lastMonthStart &&
        new Date(t.created_at) <= lastMonthEnd
    )
    .reduce((sum, t) => sum + t.calculated_cents, 0);

  return {
    totalEarnings,
    thisMonthEarnings,
    lastMonthEarnings,
    transactionCount: transactions.length,
  };
}

/**
 * Get earnings breakdown by asset
 */
export async function getAssetEarningsBreakdown(userId: string): Promise<
  Array<{
    assetId: string;
    assetTitle: string;
    totalEarnings: number;
    transactionCount: number;
  }>
> {
  const { data, error } = await serverClient
    .from("sale_royalty_transactions")
    .select(
      `
      *,
      sale_item_assets!inner(
        asset_id,
        assets!inner(
          title
        )
      )
    `
    )
    .eq("recipient_user_id", userId);

  if (error) {
    console.error("Error fetching asset earnings breakdown:", error);
    return [];
  }

  if (!data) return [];

  // Group by asset
  const assetMap = new Map<
    string,
    { assetId: string; assetTitle: string; totalEarnings: number; count: number }
  >();

  for (const transaction of data) {
    const saleItemAsset = transaction.sale_item_assets as {
      asset_id: string;
      assets: { title: string };
    };

    if (!saleItemAsset) continue;

    const assetId = saleItemAsset.asset_id;
    const assetTitle = saleItemAsset.assets.title;

    const existing = assetMap.get(assetId);
    if (existing) {
      existing.totalEarnings += transaction.calculated_cents;
      existing.count += 1;
    } else {
      assetMap.set(assetId, {
        assetId,
        assetTitle,
        totalEarnings: transaction.calculated_cents,
        count: 1,
      });
    }
  }

  return Array.from(assetMap.values()).map((item) => ({
    assetId: item.assetId,
    assetTitle: item.assetTitle,
    totalEarnings: item.totalEarnings,
    transactionCount: item.count,
  }));
}

/**
 * Get detailed transaction history with sale and product information
 */
export async function getRoyaltyTransactionHistory(
  userId: string
): Promise<
  Array<{
    id: string;
    createdAt: string;
    calculatedCents: number;
    status: string;
    productTitle: string;
    variantTitle: string;
    assetTitle: string;
    saleId: string;
  }>
> {
  const { data, error } = await serverClient
    .from("sale_royalty_transactions")
    .select(
      `
      id,
      created_at,
      calculated_cents,
      status,
      sale_id,
      sale_items!inner(
        snapshot
      ),
      sale_item_assets!inner(
        assets!inner(
          title
        )
      )
    `
    )
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false})
    .limit(50);

  if (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }

  if (!data) return [];

  return data.map((transaction) => {
    const saleItem = transaction.sale_items as { snapshot: Record<string, unknown> };
    const saleItemAsset = transaction.sale_item_assets as {
      assets: { title: string };
    };

    const snapshot = saleItem.snapshot;
    const productTitle = (snapshot.product_title as string) || "Unknown Product";
    const variantTitle = (snapshot.variant_title as string) || "Unknown Variant";
    const assetTitle = saleItemAsset?.assets?.title || "Unknown Asset";

    return {
      id: transaction.id,
      createdAt: transaction.created_at,
      calculatedCents: transaction.calculated_cents,
      status: transaction.status,
      productTitle,
      variantTitle,
      assetTitle,
      saleId: transaction.sale_id,
    };
  });
}

/**
 * Create royalty transactions for a sale item asset
 * Calculates royalties based on asset royalty configuration and sale price
 */
export async function createRoyaltyTransactionsForSaleItemAsset(params: {
  saleId: string;
  saleItemId: string;
  saleItemAssetId: string;
  assetId: string;
  saleItemPriceCents: number;
  currency: string;
}): Promise<SaleRoyaltyTransaction[]> {
  const { saleId, saleItemId, saleItemAssetId, assetId, saleItemPriceCents, currency } = params;

  // Get all royalties for this asset
  const assetRoyalties = await getAssetRoyalties(assetId);

  if (assetRoyalties.length === 0) {
    return [];
  }

  const createdTransactions: SaleRoyaltyTransaction[] = [];

  for (const royalty of assetRoyalties) {
    // Calculate the royalty amount based on type
    let calculatedCents: number;

    if (royalty.royalty_type === 'fixed') {
      // Fixed amount in cents
      calculatedCents = royalty.royalty_value;
    } else if (royalty.royalty_type === 'percentage') {
      // Percentage of sale price
      calculatedCents = Math.round((saleItemPriceCents * royalty.royalty_value) / 100);
    } else {
      console.warn(`Unknown royalty type: ${royalty.royalty_type}`);
      continue;
    }

    // Skip if calculated amount is 0 or negative
    if (calculatedCents <= 0) {
      console.warn(`Calculated royalty is ${calculatedCents} for royalty ${royalty.id}, skipping`);
      continue;
    }

    // Create the royalty transaction
    const { data, error } = await serverClient
      .from('sale_royalty_transactions')
      .insert({
        sale_id: saleId,
        sale_item_id: saleItemId,
        sale_item_asset_id: saleItemAssetId,
        asset_royalty_id: royalty.id,
        recipient_user_id: royalty.user_id,
        royalty_type: royalty.royalty_type,
        royalty_value: royalty.royalty_value,
        calculated_cents: calculatedCents,
        status: 'ready_to_pay',
        stripe_transfer_id: '',
        paid_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating royalty transaction for royalty ${royalty.id}:`, error);
      continue;
    }

    if (data) {
      createdTransactions.push(data as SaleRoyaltyTransaction);
    }
  }

  return createdTransactions;
}

/**
 * Create royalty transactions for a product sale
 * Handles both direct product royalties and embedded product royalties
 * Product-centric model (December 2024)
 */
export async function createRoyaltyTransactionsForProduct(params: {
  saleId: string;
  saleItemId: string;
  productId: string;
  saleItemPriceCents: number;
}): Promise<SaleRoyaltyTransaction[]> {
  const { saleId, saleItemId, productId, saleItemPriceCents } = params;

  // Get all royalties for this product
  const productRoyalties = await getProductRoyalties(productId);

  if (productRoyalties.length === 0) {
    return [];
  }

  const createdTransactions: SaleRoyaltyTransaction[] = [];

  for (const royalty of productRoyalties) {
    // Calculate the royalty amount based on type
    let calculatedCents: number;

    if (royalty.royalty_type === 'fixed') {
      // Fixed amount in cents
      calculatedCents = royalty.royalty_value;
    } else if (royalty.royalty_type === 'percentage') {
      // Percentage of sale price
      calculatedCents = Math.round((saleItemPriceCents * royalty.royalty_value) / 100);
    } else {
      console.warn(`Unknown royalty type: ${royalty.royalty_type}`);
      continue;
    }

    // Skip if calculated amount is 0 or negative
    if (calculatedCents <= 0) {
      console.warn(`Calculated royalty is ${calculatedCents} for royalty ${royalty.id}, skipping`);
      continue;
    }

    // Create the royalty transaction (product-centric model)
    const { data, error } = await serverClient
      .from('sale_royalty_transactions')
      .insert({
        sale_id: saleId,
        sale_item_id: saleItemId,
        product_royalty_id: royalty.id,
        recipient_user_id: royalty.user_id,
        royalty_type: royalty.royalty_type,
        royalty_value: royalty.royalty_value,
        calculated_cents: calculatedCents,
        status: 'ready_to_pay',
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating royalty transaction for royalty ${royalty.id}:`, error);
      continue;
    }

    if (data) {
      createdTransactions.push(data as SaleRoyaltyTransaction);
    }
  }

  return createdTransactions;
}

/**
 * Mark all royalty transactions for a sale as refunded
 * This prevents payouts for refunded transactions
 */
export async function markSaleRoyaltiesAsRefunded(
  saleId: string
): Promise<number> {
  const { data, error } = await serverClient
    .from('sale_royalty_transactions')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('sale_id', saleId)
    .eq('status', 'ready_to_pay')
    .select('id');

  if (error) {
    console.error('Error marking royalties as refunded:', error);
    return 0;
  }

  return data?.length || 0;
}
