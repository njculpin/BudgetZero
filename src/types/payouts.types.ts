export type PayoutStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  /** Stripe reversed the transfer; the royalties became owed again. */
  | 'reversed';

export interface Payout {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  requested_at: string;
  processed_at: string | null;
  paid_at: string | null;
  failed_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutItem {
  /** True when the parent payout failed and this line returned to the balance. */
  voided?: boolean;
  id: string;
  payout_id: string;
  royalty_transaction_id: string;
  amount_cents: number;
  created_at: string;
}
