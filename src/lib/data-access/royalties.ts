import { serverClient } from './client';
import type { AssetRoyalty, SaleRoyaltyTransaction } from '@/types';

export interface CreateRoyaltyParams {
  assetId: string;
  userId: string;
  royaltyValue: number; // Flat rate in cents
}

/**
 * Get all royalties for an asset
 */
export const getAssetRoyalties = async (assetId: string): Promise<AssetRoyalty[]> => {
  const { data, error } = await serverClient
    .from('asset_royalties')
    .select('*')
    .eq('asset_id', assetId)
    .eq('deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching asset royalties:', error);
    return [];
  }

  return data as AssetRoyalty[];
};

/**
 * Get a specific royalty by ID
 */
export const getRoyaltyById = async (royaltyId: string): Promise<AssetRoyalty | null> => {
  const { data, error } = await serverClient
    .from('asset_royalties')
    .select('*')
    .eq('id', royaltyId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as AssetRoyalty;
};

/**
 * Create a new royalty for an asset
 */
export const createAssetRoyalty = async (
  params: CreateRoyaltyParams
): Promise<AssetRoyalty | null> => {
  const { data, error } = await serverClient
    .from('asset_royalties')
    .insert({
      asset_id: params.assetId,
      user_id: params.userId,
      royalty_type: 'fixed',
      royalty_value: params.royaltyValue,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset royalty:', error);
    return null;
  }

  return data as AssetRoyalty;
};

/**
 * Update an existing royalty
 */
export const updateAssetRoyalty = async (
  royaltyId: string,
  royaltyValue: number
): Promise<boolean> => {
  const { error } = await serverClient
    .from('asset_royalties')
    .update({
      royalty_value: royaltyValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error updating asset royalty:', error);
    return false;
  }

  return true;
};

/**
 * Delete a royalty (soft delete)
 */
export const deleteAssetRoyalty = async (
  royaltyId: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from('asset_royalties')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error deleting asset royalty:', error);
    return false;
  }

  return true;
};

/**
 * Calculate total flat rate cost for an asset
 * Returns the sum of all royalty flat rates in cents
 */
export const calculateTotalAssetCost = async (
  assetId: string
): Promise<number> => {
  const royalties = await getAssetRoyalties(assetId);
  return royalties.reduce((total, royalty) => total + royalty.royalty_value, 0);
};

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
    .order("created_at", { ascending: false })
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
