import { serverClient } from './client';
import type { Sale, SaleItem, SaleStatus, SaleItemAsset } from '@/types';

export interface CreateSaleParams {
  userId: string;
  userEmail: string;
  priceCents: number;
  taxCents?: number;
  currency: string;
  stripeChargeId: string;
  status?: SaleStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateSaleItemParams {
  saleId: string;
  productId: string;
  variantId: string;
  priceCents: number;
  currency: string;
  quantity: number;
  snapshot: Record<string, unknown>;
}

/**
 * Create a new sale
 */
export const createSale = async (
  params: CreateSaleParams
): Promise<Sale | null> => {
  const { data, error } = await serverClient
    .from('sales')
    .insert({
      user_id: params.userId,
      user_email: params.userEmail,
      price_cents: params.priceCents,
      tax_cents: params.taxCents || 0,
      currency: params.currency,
      stripe_charge_id: params.stripeChargeId,
      status: params.status || 'pending',
      completed_at: params.status === 'paid' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating sale:', error);
    return null;
  }

  return data as Sale;
};

/**
 * Create a sale item
 */
export const createSaleItem = async (
  params: CreateSaleItemParams
): Promise<SaleItem | null> => {
  const { data, error } = await serverClient
    .from('sale_items')
    .insert({
      sale_id: params.saleId,
      product_id: params.productId,
      variant_id: params.variantId,
      price_cents: params.priceCents,
      currency: params.currency,
      quantity: params.quantity,
      snapshot: params.snapshot,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating sale item:', error);
    return null;
  }

  return data as SaleItem;
};

/**
 * Get sale by ID
 */
export const getSaleById = async (saleId: string): Promise<Sale | null> => {
  const { data, error } = await serverClient
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as Sale;
};

/**
 * Get sale by Stripe charge ID
 */
export const getSaleByStripeChargeId = async (
  stripeChargeId: string
): Promise<Sale | null> => {
  const { data, error } = await serverClient
    .from('sales')
    .select('*')
    .eq('stripe_charge_id', stripeChargeId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as Sale;
};

/**
 * Get user's sales
 */
export const getUserSales = async (userId: string): Promise<Sale[]> => {
  const { data, error } = await serverClient
    .from('sales')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data as Sale[];
};

/**
 * Get sale items for a sale
 */
export const getSaleItems = async (saleId: string): Promise<SaleItem[]> => {
  const { data, error } = await serverClient
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId)
    .eq('deleted', false);

  if (error) {
    return [];
  }

  return data as SaleItem[];
};

/**
 * Update sale status
 */
export const updateSaleStatus = async (
  saleId: string,
  status: SaleStatus
): Promise<boolean> => {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'paid') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await serverClient
    .from('sales')
    .update(updateData)
    .eq('id', saleId);

  if (error) {
    console.error('Error updating sale status:', error);
    return false;
  }

  return true;
};

/**
 * Mark sale as refunded
 */
export const refundSale = async (
  saleId: string,
  refundReason: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from('sales')
    .update({
      status: 'refunded',
      refund_reason: refundReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', saleId);

  if (error) {
    console.error('Error refunding sale:', error);
    return false;
  }

  return true;
};

/**
 * Get sale item assets for a sale item
 */
export const getSaleItemAssets = async (saleItemId: string): Promise<SaleItemAsset[]> => {
  const { data, error } = await serverClient
    .from('sale_item_assets')
    .select('*')
    .eq('sale_item_id', saleItemId)
    .eq('deleted', false);

  if (error) {
    return [];
  }

  return data as SaleItemAsset[];
};

/**
 * Check if user has purchased a specific asset
 */
export const hasUserPurchasedAsset = async (
  userId: string,
  assetId: string
): Promise<boolean> => {
  // Get user's paid sales
  const { data: sales, error: salesError } = await serverClient
    .from('sales')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .eq('deleted', false);

  if (salesError || !sales || sales.length === 0) {
    return false;
  }

  const saleIds = sales.map(s => s.id);

  // Get sale items for these sales
  const { data: saleItems, error: itemsError } = await serverClient
    .from('sale_items')
    .select('id')
    .in('sale_id', saleIds)
    .eq('deleted', false);

  if (itemsError || !saleItems || saleItems.length === 0) {
    return false;
  }

  const saleItemIds = saleItems.map(si => si.id);

  // Check if any sale item has this asset
  const { data: saleItemAssets, error: assetsError } = await serverClient
    .from('sale_item_assets')
    .select('id')
    .in('sale_item_id', saleItemIds)
    .eq('asset_id', assetId)
    .eq('deleted', false)
    .limit(1);

  if (assetsError) {
    return false;
  }

  return saleItemAssets && saleItemAssets.length > 0;
};
