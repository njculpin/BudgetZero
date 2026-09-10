import { serverClient } from './client';
import type { Payout, PayoutItem } from '../types';

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
    // Throws rather than returning 0. Swallowing hid the difference between
    // "released nothing" and "refused, because this payout is already paid" —
    // and the second is a guard violation someone needs to know about.
    //
    // Call sites on an error path must wrap this so it cannot mask the original
    // failure. See payouts/execute.ts.
    throw new Error(`Failed to release payout ${payoutId}: ${error.message}`);
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
export async function claimPayoutForProcessing(payoutId: string): Promise<boolean> {
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

// `updatePayoutStatus` was removed. It could set a payout to 'failed' without
// releasing the royalty transactions that payout had reserved, stranding a
// creator's earnings in a state nothing would ever pay out. The lifecycle is now
// only reachable through claimPayoutForProcessing / settlePayout / releasePayout,
// each of which keeps the payout row and its reservations consistent.

/**
 * Calculate the balance a creator can withdraw right now.
 *
 * Only `ready_to_pay` counts, and only once it has matured. Transactions attached
 * to a pending payout are `reserved` and transferred ones are `paid`, so neither
 * can be withdrawn twice; and anything still inside the hold period is excluded so
 * a refund arriving in that window is caught before the money leaves.
 *
 * See `getClearingBalance` for what is still maturing — a creator seeing only this
 * figure after a sale would reasonably think they had not been credited.
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
    .eq('status', 'ready_to_pay')
    .lte('available_at', new Date().toISOString());

  if (error) {
    console.error('Error fetching available balance:', error);
    return { totalCents: 0, transactionIds: [] };
  }

  if (!transactions || transactions.length === 0) {
    return { totalCents: 0, transactionIds: [] };
  }

  const totalCents = transactions.reduce((sum, t) => sum + t.calculated_cents, 0);
  const transactionIds = transactions.map((t) => t.id);

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
export async function getPendingPayoutsForAdmin(): Promise<PendingPayoutWithRecipient[]> {
  const { data, error } = await serverClient
    .from('payouts')
    .select(
      `
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
    `
    )
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
      recipient: Array.isArray(users) ? (users[0] ?? null) : (users ?? null),
      item_count: Array.isArray(items) ? items.length : 0,
    };
  });
}

export interface PayoutReversalResult {
  payoutId: string;
  restoredCount: number;
  amountCents: number;
}

/**
 * Undo a settled payout after Stripe reverses its transfer.
 *
 * The royalties return to `ready_to_pay` — the creator genuinely is owed the money
 * again — and the payout row survives as `reversed` so the history of a transfer
 * that happened and came back is not lost.
 *
 * @returns `null` when no payout matches the transfer id. That is an orphaned
 * reversal: money moved that this system has no record of, and the caller must
 * alert rather than ignore it.
 */
export async function reversePayout(
  stripeTransferId: string,
  reason?: string
): Promise<PayoutReversalResult | null> {
  const { data, error } = await serverClient.rpc('reverse_payout', {
    p_stripe_transfer_id: stripeTransferId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw new Error(`Failed to reverse payout: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return null;
  }

  return {
    payoutId: row.out_payout_id as string,
    restoredCount: row.out_restored_count as number,
    amountCents: row.out_amount_cents as number,
  };
}

/**
 * Release any pending payout funded by a given sale.
 *
 * Must be called BEFORE marking that sale's royalties refunded. A refund that
 * lands while a payout is pending would otherwise leave the payout holding
 * royalties it can no longer justify, and `releasePayout` cannot recover them
 * afterwards because it only restores rows still in `reserved`.
 */
export async function releasePayoutsForSale(
  saleId: string
): Promise<Array<{ payoutId: string; releasedCount: number }>> {
  const { data, error } = await serverClient.rpc('release_payouts_for_sale', {
    p_sale_id: saleId,
  });

  if (error) {
    console.error(`Failed to release payouts for sale ${saleId}:`, error);
    return [];
  }

  return (
    (data as Array<{ out_payout_id: string; out_released_count: number }>) || []
  ).map((row) => ({
    payoutId: row.out_payout_id,
    releasedCount: row.out_released_count,
  }));
}

export interface ClearingBalance {
  totalCents: number;
  transactionCount: number;
  /** When the earliest-maturing royalty becomes payable, if any are clearing. */
  nextAvailableAt: string | null;
}

/**
 * Earnings credited but still inside the hold period.
 *
 * This exists so the creator-facing view can say "$40 available, $15 clearing
 * until 3 March" rather than showing a balance that silently omits a sale they
 * know happened. Money that appears to vanish is worse than money that is visibly
 * pending.
 */
export async function getClearingBalance(userId: string): Promise<ClearingBalance> {
  const { data, error } = await serverClient
    .from('sale_royalty_transactions')
    .select('calculated_cents, available_at')
    .eq('recipient_user_id', userId)
    .eq('deleted', false)
    .eq('status', 'ready_to_pay')
    .gt('available_at', new Date().toISOString())
    .order('available_at', { ascending: true });

  if (error) {
    console.error('Error fetching clearing balance:', error);
    return { totalCents: 0, transactionCount: 0, nextAvailableAt: null };
  }

  const rows = data ?? [];

  return {
    totalCents: rows.reduce((sum, row) => sum + (row.calculated_cents as number), 0),
    transactionCount: rows.length,
    nextAvailableAt: rows.length > 0 ? (rows[0].available_at as string) : null,
  };
}
