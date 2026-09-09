import { serverClient } from './client';
import type { Payout, PayoutItem, PayoutStatus } from '@/types';

export interface RequestPayoutParams {
  userId: string;
  amountCents: number;
  minimumCents?: number;
  notes?: string;
}

export interface PayoutRequestResult {
  payoutId: string;
  /**
   * The amount actually reserved. Royalty transactions are indivisible, so this can
   * be less than the amount requested — it is the authoritative figure to show the
   * user and must not be replaced by the request amount.
   */
  reservedCents: number;
  transactionCount: number;
}

/**
 * Create a payout request, atomically reserving the royalty transactions that fund it.
 *
 * All of the selection, reservation and payout creation happens inside the
 * `request_payout` Postgres function. Doing it here in JS would leave a window in
 * which two concurrent requests both read the same available balance and both
 * succeed — which is how the same earnings could be withdrawn twice.
 */
export async function requestPayout(
  params: RequestPayoutParams
): Promise<PayoutRequestResult> {
  const { data, error } = await serverClient.rpc('request_payout', {
    p_user_id: params.userId,
    p_amount_cents: params.amountCents,
    p_minimum_cents: params.minimumCents ?? 1000,
    p_notes: params.notes ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error('Payout request returned no result');
  }

  return {
    payoutId: row.payout_id as string,
    reservedCents: row.reserved_cents as number,
    transactionCount: row.transaction_count as number,
  };
}

/**
 * Settle a payout after a successful Stripe transfer: the payout and every royalty
 * transaction it reserved become `paid`, leaving them permanently out of the
 * available balance.
 */
export async function settlePayout(
  payoutId: string,
  stripeTransferId: string
): Promise<number> {
  const { data, error } = await serverClient.rpc('settle_payout', {
    p_payout_id: payoutId,
    p_stripe_transfer_id: stripeTransferId,
  });

  if (error) {
    throw new Error(`Failed to settle payout ${payoutId}: ${error.message}`);
  }

  return (data as number) ?? 0;
}

/**
 * Release a failed payout, returning its reserved royalty transactions to the
 * creator's available balance so the earnings are not stranded.
 */
export async function releasePayout(
  payoutId: string,
  failedReason?: string
): Promise<number> {
  const { data, error } = await serverClient.rpc('release_payout', {
    p_payout_id: payoutId,
    p_failed_reason: failedReason ?? null,
  });

  if (error) {
    console.error(`Failed to release payout ${payoutId}:`, error);
    return 0;
  }

  return (data as number) ?? 0;
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
 * Move a payout from `pending` to `processing`, returning whether this caller won.
 *
 * The status filter makes the transition the claim itself: of two concurrent
 * executions, only one update matches a `pending` row, so only one proceeds to
 * transfer money.
 */
export async function claimPayoutForProcessing(
  payoutId: string
): Promise<boolean> {
  const { data, error } = await serverClient
    .from('payouts')
    .update({
      status: 'processing',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('Error claiming payout for processing:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
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
 * Calculate available balance for payout.
 *
 * Only `ready_to_pay` counts. Transactions already attached to a pending payout are
 * `reserved` and transferred ones are `paid`, so neither can be withdrawn twice.
 */
export async function getAvailablePayoutBalance(userId: string): Promise<{
  totalCents: number;
  transactionIds: string[];
}> {
  const { data: transactions, error } = await serverClient
    .from('sale_royalty_transactions')
    .select('id, calculated_cents')
    .eq('recipient_user_id', userId)
    .eq('deleted', false)
    .eq('status', 'ready_to_pay');

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

export interface PendingPayoutWithRecipient extends Payout {
  recipient: {
    id: string;
    handle: string;
    name: string | null;
    email: string;
    stripe_connect_account_id: string | null;
    stripe_connect_payouts_enabled: boolean;
  } | null;
  /** How many royalty transactions this payout reserved. */
  item_count: number;
}

/**
 * The admin payout queue: pending payouts oldest first, with enough recipient
 * detail to decide whether each one can actually be paid.
 *
 * Connect status is included because a payout to a recipient without payouts
 * enabled will fail at the transfer step, and an admin should be able to see that
 * before triggering it rather than after.
 */
export async function getPendingPayoutsForAdmin(): Promise<
  PendingPayoutWithRecipient[]
> {
  const { data, error } = await serverClient
    .from('payouts')
    .select(`
      *,
      users!payouts_user_id_fkey (
        id,
        handle,
        name,
        email,
        stripe_connect_account_id,
        stripe_connect_payouts_enabled
      ),
      payout_items (id)
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) {
    console.error('Error fetching admin payout queue:', error);
    return [];
  }

  type JoinedUser = PendingPayoutWithRecipient['recipient'];

  return (data || []).map((row) => {
    const users = (row as { users?: JoinedUser | JoinedUser[] }).users;
    const items = (row as { payout_items?: unknown[] }).payout_items;

    return {
      ...(row as unknown as Payout),
      recipient: (Array.isArray(users) ? users[0] ?? null : users ?? null),
      item_count: Array.isArray(items) ? items.length : 0,
    };
  });
}
