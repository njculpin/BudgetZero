import { serverClient } from './client';
import type { ProductRoyalty, SaleRoyaltyTransaction } from '@/types';

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
 * Mark a refunded sale's royalty transactions as refunded, so they are never paid.
 *
 * Covers both `ready_to_pay` and `reserved`. A creator may already have requested
 * a payout by the time the buyer refunds, which moves those rows to `reserved` —
 * matching only `ready_to_pay` would silently skip them and the platform would go
 * on to pay royalties on a sale it had refunded.
 *
 * `paid` is deliberately excluded: that money has already left via Stripe and
 * cannot be reversed by a status change. Those need a clawback, which is a
 * separate decision.
 *
 * @returns the number of transactions refunded. If a pending payout referenced any
 * of them, its amount no longer matches its items and it needs releasing — see the
 * caller in the charge.refunded webhook branch.
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
    .in('status', ['ready_to_pay', 'reserved'])
    .select('id');

  if (error) {
    console.error('Error marking royalties as refunded:', error);
    return 0;
  }

  return data?.length || 0;
}
