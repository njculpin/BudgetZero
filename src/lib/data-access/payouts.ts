import { serverClient } from './client';
import type { Payout, PayoutItem, PayoutStatus } from '@/types';

export interface CreatePayoutParams {
  userId: string;
  amountCents: number;
  currency?: string;
  royaltyTransactionIds: string[];
  notes?: string;
}

/**
 * Create a payout request
 */
export async function createPayout(params: CreatePayoutParams): Promise<Payout | null> {
  const { data: payout, error } = await serverClient
    .from('payouts')
    .insert({
      user_id: params.userId,
      amount_cents: params.amountCents,
      currency: params.currency || 'usd',
      status: 'pending',
      notes: params.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payout:', error);
    return null;
  }

  // Create payout items linking to royalty transactions
  if (params.royaltyTransactionIds.length > 0) {
    const payoutItems = params.royaltyTransactionIds.map(transactionId => ({
      payout_id: payout.id,
      royalty_transaction_id: transactionId,
      amount_cents: params.amountCents / params.royaltyTransactionIds.length, // Simplified, should be per-transaction
    }));

    const { error: itemsError } = await serverClient
      .from('payout_items')
      .insert(payoutItems);

    if (itemsError) {
      console.error('Error creating payout items:', itemsError);
    }
  }

  return payout as Payout;
}

/**
 * Get all payouts for a user
 */
export async function getUserPayouts(userId: string): Promise<Payout[]> {
  const { data, error } = await serverClient
    .from('payouts')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching user payouts:', error);
    return [];
  }

  return (data as Payout[]) || [];
}

/**
 * Get payout by ID
 */
export async function getPayoutById(payoutId: string): Promise<Payout | null> {
  const { data, error } = await serverClient
    .from('payouts')
    .select('*')
    .eq('id', payoutId)
    .single();

  if (error) {
    console.error('Error fetching payout:', error);
    return null;
  }

  return data as Payout;
}

/**
 * Get payout items for a payout
 */
export async function getPayoutItems(payoutId: string): Promise<PayoutItem[]> {
  const { data, error } = await serverClient
    .from('payout_items')
    .select('*')
    .eq('payout_id', payoutId);

  if (error) {
    console.error('Error fetching payout items:', error);
    return [];
  }

  return (data as PayoutItem[]) || [];
}

/**
 * Update payout status
 */
export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  stripeTransferId?: string,
  failedReason?: string
): Promise<boolean> {
  const updateData: {
    status: PayoutStatus;
    processed_at?: string;
    paid_at?: string;
    stripe_transfer_id?: string;
    failed_reason?: string;
  } = {
    status,
  };

  if (status === 'processing') {
    updateData.processed_at = new Date().toISOString();
  }

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  if (stripeTransferId) {
    updateData.stripe_transfer_id = stripeTransferId;
  }

  if (failedReason) {
    updateData.failed_reason = failedReason;
  }

  const { error } = await serverClient
    .from('payouts')
    .update(updateData)
    .eq('id', payoutId);

  if (error) {
    console.error('Error updating payout status:', error);
    return false;
  }

  return true;
}

/**
 * Get all pending payouts (for admin)
 */
export async function getPendingPayouts(): Promise<Payout[]> {
  const { data, error } = await serverClient
    .from('payouts')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending payouts:', error);
    return [];
  }

  return (data as Payout[]) || [];
}

/**
 * Calculate available balance for payout (unpaid royalties)
 */
export async function getAvailablePayoutBalance(userId: string): Promise<{
  totalCents: number;
  transactionIds: string[];
}> {
  // Get all paid royalty transactions for user
  const { data: transactions, error } = await serverClient
    .from('sale_royalty_transactions')
    .select('id, calculated_cents')
    .eq('recipient_user_id', userId)
    .eq('status', 'ready_to_pay'); // Royalties ready to be paid out

  if (error) {
    console.error('Error fetching available balance:', error);
    return { totalCents: 0, transactionIds: [] };
  }

  if (!transactions || transactions.length === 0) {
    return { totalCents: 0, transactionIds: [] };
  }

  const totalCents = transactions.reduce((sum, t) => sum + t.calculated_cents, 0);
  const transactionIds = transactions.map(t => t.id);

  return { totalCents, transactionIds };
}
