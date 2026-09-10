import { serverClient } from './client';
import type { Sale, SaleItem, SaleStatus, PaymentMethod, ShippingAddress } from '@/types';

export interface CreateSaleParams {
  userId: string;
  userEmail: string;
  priceCents: number;
  taxCents?: number;
  currency: string;
  stripeChargeId: string;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress?: ShippingAddress | null;
  orderNotes?: string | null;
  completedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateSaleItemParams {
  saleId: string;
  productId: string;
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
      payment_method: params.paymentMethod || 'stripe',
      shipping_address: params.shippingAddress || null,
      order_notes: params.orderNotes || null,
      completed_at: params.completedAt || (params.status === 'paid' ? new Date().toISOString() : null),
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
 * Record a refund against a sale.
 *
 * `refundedCents` is Stripe's running total, not the amount of this particular
 * refund, so this is safe to apply repeatedly as partial refunds accumulate.
 *
 * A partial refund leaves the sale `partially_refunded` and does NOT revoke
 * entitlement — the customer keeps what they bought. Revoking downloads over a
 * goodwill refund would punish someone the platform chose to compensate.
 */
export const recordSaleRefund = async (
  saleId: string,
  refundedCents: number,
  refundReason: string,
  isFullRefund: boolean
): Promise<boolean> => {
  const { error } = await serverClient
    .from('sales')
    .update({
      status: isFullRefund ? 'refunded' : 'partially_refunded',
      refunded_cents: refundedCents,
      refund_reason: refundReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', saleId);

  if (error) {
    console.error('Error recording sale refund:', error);
    return false;
  }

  return true;
};

/**
 * Check if user has purchased a specific product.
 *
 * Access is granted two ways:
 *   1. Directly — the product appears as a line item on one of the user's paid sales.
 *   2. By embedding — the product is a component of a product they bought. Buying a
 *      bundle grants access to every child product embedded within it, which is the
 *      whole point of the product-in-product model.
 *
 * Embedded access is resolved through `product_components` rather than a join table,
 * so it stays correct even though components are never their own line items.
 */
export const hasUserPurchasedProduct = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  const purchasedProductIds = await getPurchasedProductIds(userId);
  return purchasedProductIds.has(productId);
};

/**
 * Resolve every product ID a user has access to, expanding purchased products into
 * the components they embed. Returned as a Set so callers checking several products
 * (a download page, a purchase detail view) pay the query cost once.
 */
export const getPurchasedProductIds = async (
  userId: string
): Promise<Set<string>> => {
  // Get user's paid sales
  const { data: sales, error: salesError } = await serverClient
    .from('sales')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .eq('deleted', false);

  if (salesError || !sales || sales.length === 0) {
    return new Set();
  }

  const saleIds = sales.map(s => s.id);

  // Products bought directly as line items
  const { data: saleItems, error: itemsError } = await serverClient
    .from('sale_items')
    .select('product_id')
    .in('sale_id', saleIds)
    .eq('deleted', false);

  if (itemsError || !saleItems || saleItems.length === 0) {
    return new Set();
  }

  const accessibleIds = new Set<string>(
    saleItems.map(item => item.product_id as string)
  );

  // Expand into embedded components. One level of expansion matches how pricing and
  // royalties are calculated at checkout; nested embedding is not currently priced.
  const { data: components, error: componentsError } = await serverClient
    .from('product_components')
    .select('child_product_id')
    .in('parent_product_id', Array.from(accessibleIds))
    .eq('deleted', false);

  if (componentsError) {
    console.error('Error resolving embedded product access:', componentsError);
    return accessibleIds;
  }

  for (const component of components || []) {
    accessibleIds.add(component.child_product_id as string);
  }

  return accessibleIds;
};
