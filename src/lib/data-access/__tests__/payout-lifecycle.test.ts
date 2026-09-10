/**
 * Payout Lifecycle Integration Tests
 *
 * Covers the money-out machinery added in migrations 00008, 00011 and 00012. All
 * of it was previously verified only by hand, and three separate bugs in it
 * typechecked clean and passed the whole suite — so these drive the real Postgres
 * functions rather than mocking them.
 *
 * What is pinned here:
 * - reservation selects transactions that fit, and skips ones that do not
 * - settle and release refuse to rewrite a terminal payout
 * - a reversed transfer returns the royalties to the creator's balance
 * - a refund releases a payout still holding the refunded royalties
 * - clients cannot create a payout directly, bypassing reservation
 *
 * Business impact: every failure mode below either loses a creator's money or
 * pays it to them twice.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  requestPayout,
  settlePayout,
  releasePayout,
  reversePayout,
  releasePayoutsForSale,
  claimPayoutForProcessing,
  getPayoutById,
  getPayoutItems,
  getAvailablePayoutBalance,
  getClearingBalance,
} from '../payouts';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  (import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY)!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const suffix = crypto.randomUUID().slice(0, 8);

describe('Payout lifecycle', () => {
  let creatorId: string;
  let productId: string;
  let royaltyId: string;
  let saleId: string;
  let saleItemId: string;

  beforeAll(async () => {
    const { data: creator, error: creatorError } =
      await supabase.auth.admin.createUser({
        email: `payout-lifecycle-${suffix}@test.local`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

    if (creatorError || !creator?.user) {
      throw new Error(`Failed to create test creator: ${creatorError?.message}`);
    }

    creatorId = creator.user.id;

    const { data: product } = await supabase
      .from('products')
      .insert({
        handle: `payout-lifecycle-${suffix}`,
        user_id: creatorId,
        title: 'Payout lifecycle fixture',
        status: 'public',
      })
      .select('id')
      .single();

    productId = product!.id;

    const { data: royalty } = await supabase
      .from('product_royalties')
      .insert({
        product_id: productId,
        user_id: creatorId,
        royalty_type: 'fixed',
        royalty_value: 1000,
      })
      .select('id')
      .single();

    royaltyId = royalty!.id;

    const { data: sale } = await supabase
      .from('sales')
      .insert({
        user_id: creatorId,
        user_email: `buyer-${suffix}@test.local`,
        price_cents: 10000,
        currency: 'usd',
        stripe_charge_id: `pi_lifecycle_${suffix}`,
        status: 'paid',
      })
      .select('id')
      .single();

    saleId = sale!.id;

    const { data: saleItem } = await supabase
      .from('sale_items')
      .insert({
        sale_id: saleId,
        product_id: productId,
        price_cents: 10000,
        currency: 'usd',
        quantity: 1,
        snapshot: {},
      })
      .select('id')
      .single();

    saleItemId = saleItem!.id;
  });

  afterAll(async () => {
    // Unconditional: a leaked auth user blocks the next run's email uniqueness.
    if (creatorId) {
      await supabase.auth.admin.deleteUser(creatorId);
    }
  });

  /** Seed a claimable royalty. Tests spend balance, so each creates its own. */
  async function seedRoyalty(amountCents: number): Promise<string> {
    const { data, error } = await supabase
      .from('sale_royalty_transactions')
      .insert({
        sale_id: saleId,
        sale_item_id: saleItemId,
        product_royalty_id: royaltyId,
        recipient_user_id: creatorId,
        royalty_type: 'fixed',
        royalty_value: amountCents,
        calculated_cents: amountCents,
        status: 'ready_to_pay',
        // Matured past the hold period: this suite tests payout mechanics, not the
        // hold. Without it a royalty is held 14 days and never reads as available.
        available_at: new Date(Date.now() - 86_400_000).toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to seed royalty: ${error?.message}`);
    }

    return data.id as string;
  }

  /**
   * Seed a royalty WITHOUT pre-maturing it, so the hold period applies. The
   * seedRoyalty helper above back-dates available_at because most of these tests
   * are about payout mechanics rather than the hold.
   */
  async function seedHeldRoyalty(amountCents: number): Promise<string> {
    const { data, error } = await supabase
      .from('sale_royalty_transactions')
      .insert({
        sale_id: saleId,
        sale_item_id: saleItemId,
        product_royalty_id: royaltyId,
        recipient_user_id: creatorId,
        royalty_type: 'fixed',
        royalty_value: amountCents,
        calculated_cents: amountCents,
        status: 'ready_to_pay',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to seed held royalty: ${error?.message}`);
    }

    return data.id as string;
  }

  /** Drop every royalty for this creator so a test starts from zero balance. */
  async function clearBalance(): Promise<void> {
    await supabase
      .from('sale_royalty_transactions')
      .delete()
      .eq('recipient_user_id', creatorId);
  }

  describe('reservation selects what fits', () => {
    it('reserves transactions that fit within the requested amount', async () => {
      await clearBalance();
      await seedRoyalty(3000);
      await seedRoyalty(2000);

      const result = await requestPayout({
        userId: creatorId,
        amountCents: 5000,
      });

      expect(result.reservedCents).toBe(5000);
      expect(result.transactionCount).toBe(2);

      // Reserved money must leave the available balance.
      const balance = await getAvailablePayoutBalance(creatorId);
      expect(balance.totalCents).toBe(0);
    });

    it('skips an oversized transaction rather than abandoning the scan', async () => {
      await clearBalance();
      // The large one is oldest, so a loop that EXITs on the first misfit would
      // never reach the two smaller ones and would report zero claimable.
      await seedRoyalty(9000);
      await seedRoyalty(500);
      await seedRoyalty(500);

      const result = await requestPayout({
        userId: creatorId,
        amountCents: 1500,
        minimumCents: 500,
      });

      expect(result.reservedCents).toBe(1000);
      expect(result.transactionCount).toBe(2);

      // The oversized transaction is untouched and still claimable.
      const balance = await getAvailablePayoutBalance(creatorId);
      expect(balance.totalCents).toBe(9000);
    });

    it('records payout_items that sum to the payout amount', async () => {
      await clearBalance();
      await seedRoyalty(2500);
      await seedRoyalty(1500);

      const result = await requestPayout({
        userId: creatorId,
        amountCents: 4000,
      });

      const items = await getPayoutItems(result.payoutId);
      const total = items.reduce((sum, item) => sum + item.amount_cents, 0);

      // A mismatch here is what the pre-transfer integrity check refuses to wire.
      expect(total).toBe(4000);
    });

    it('refuses a request below the minimum', async () => {
      await clearBalance();
      await seedRoyalty(400);

      await expect(
        requestPayout({ userId: creatorId, amountCents: 400, minimumCents: 1000 })
      ).rejects.toThrow(/Insufficient available balance/);
    });
  });

  describe('terminal states cannot be rewritten', () => {
    it('refuses to settle a released payout', async () => {
      await clearBalance();
      await seedRoyalty(2000);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 2000,
      });

      await releasePayout(payoutId, 'transfer declined');

      // A late or duplicate webhook must not resurrect this as paid: it would
      // stamp a real-looking transfer id on a payout backed by nothing, while its
      // royalties sat claimable by a second, genuine payout.
      await expect(
        settlePayout(payoutId, 'tr_late_webhook')
      ).rejects.toThrow(/cannot be settled/);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('failed');
      expect(payout?.stripe_transfer_id).toBeFalsy();
    });

    it('refuses to release a settled payout', async () => {
      await clearBalance();
      await seedRoyalty(2000);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 2000,
      });

      await settlePayout(payoutId, 'tr_already_paid');

      // Releasing would strip the audit trail from a transfer that really happened.
      await expect(
        releasePayout(payoutId, 'should not apply')
      ).rejects.toThrow(/cannot be released/);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('paid');
      expect(payout?.stripe_transfer_id).toBe('tr_already_paid');
    });

    it('only lets one caller claim a payout for processing', async () => {
      await clearBalance();
      await seedRoyalty(2000);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 2000,
      });

      // Two concurrent executions must not both go on to transfer money.
      expect(await claimPayoutForProcessing(payoutId)).toBe(true);
      expect(await claimPayoutForProcessing(payoutId)).toBe(false);
    });
  });

  describe('release returns money to the creator', () => {
    it('restores the balance and keeps the payout as a record', async () => {
      await clearBalance();
      await seedRoyalty(3000);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 3000,
      });

      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(0);

      const released = await releasePayout(payoutId, 'transfer declined');
      expect(released).toBe(1);

      // Earnings must not be stranded in a payout that will never complete.
      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(3000);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('failed');
      expect(payout?.failed_reason).toBe('transfer declined');
    });

    it('voids payout_items instead of deleting them', async () => {
      await clearBalance();
      await seedRoyalty(3000);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 3000,
      });

      await releasePayout(payoutId, 'transfer declined');

      // Deleting would lose which transactions the failed payout attempted —
      // exactly what reconciliation needs.
      const items = await getPayoutItems(payoutId);
      expect(items.length).toBe(1);
      expect(items[0].voided).toBe(true);
    });

    it('lets released royalties fund a later payout', async () => {
      await clearBalance();
      await seedRoyalty(3000);

      const first = await requestPayout({ userId: creatorId, amountCents: 3000 });
      await releasePayout(first.payoutId, 'transfer declined');

      // The partial unique index must not block reuse after a void.
      const second = await requestPayout({
        userId: creatorId,
        amountCents: 3000,
      });

      expect(second.reservedCents).toBe(3000);
      expect(second.payoutId).not.toBe(first.payoutId);
    });
  });

  describe('a reversed transfer becomes owed again', () => {
    it('returns settled royalties to the balance and marks the payout reversed', async () => {
      await clearBalance();
      await seedRoyalty(2000);
      await seedRoyalty(2000);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 4000,
      });

      await settlePayout(payoutId, `tr_reversed_${suffix}`);
      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(0);

      const reversal = await reversePayout(
        `tr_reversed_${suffix}`,
        'reversed by Stripe'
      );

      expect(reversal).not.toBeNull();
      expect(reversal!.restoredCount).toBe(2);
      expect(reversal!.amountCents).toBe(4000);

      // Money came back from the creator, so they are owed it again. Leaving the
      // royalties 'paid' would make their balance permanently wrong in our favour.
      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(4000);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('reversed');
    });

    it('reports an orphaned reversal rather than failing silently', async () => {
      // A reversal for a transfer we have no payout for means money moved that
      // this system cannot account for. The caller alerts on null.
      const reversal = await reversePayout(
        `tr_orphan_${suffix}`,
        'reversed by Stripe'
      );

      expect(reversal).toBeNull();
    });

    it('is idempotent for a duplicate reversal delivery', async () => {
      await clearBalance();
      await seedRoyalty(1500);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 1500,
      });
      await settlePayout(payoutId, `tr_dup_${suffix}`);
      await reversePayout(`tr_dup_${suffix}`, 'first delivery');

      const balanceAfterFirst = await getAvailablePayoutBalance(creatorId);

      const second = await reversePayout(`tr_dup_${suffix}`, 'second delivery');

      // Must not credit the creator twice for one reversal.
      expect(second!.restoredCount).toBe(0);
      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(
        balanceAfterFirst.totalCents
      );
    });
  });

  describe('a refund releases a payout it was funding', () => {
    it('releases a pending payout holding the refunded royalties', async () => {
      await clearBalance();
      await seedRoyalty(2500);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 2500,
      });

      const released = await releasePayoutsForSale(saleId);

      // Without this the payout keeps royalties it can no longer justify and
      // execute.ts transfers the original, un-reduced amount.
      expect(released.length).toBe(1);
      expect(released[0].payoutId).toBe(payoutId);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('failed');
      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(2500);
    });

    it('leaves an already-settled payout alone', async () => {
      await clearBalance();
      await seedRoyalty(2500);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 2500,
      });
      await settlePayout(payoutId, `tr_settled_${suffix}`);

      // That money has already gone out; a refund cannot claw it back by
      // rewriting our own records.
      const released = await releasePayoutsForSale(saleId);

      expect(released.length).toBe(0);
      expect((await getPayoutById(payoutId))?.status).toBe('paid');
    });
  });

  describe('the hold period', () => {
    it('keeps a fresh royalty out of the available balance', async () => {
      await clearBalance();
      await seedHeldRoyalty(5000);

      // Payable the instant a sale completes meant a buyer could purchase Monday,
      // the creator be paid Tuesday, and the buyer refund Wednesday — with no way
      // to recover the money.
      const balance = await getAvailablePayoutBalance(creatorId);
      expect(balance.totalCents).toBe(0);
    });

    it('shows it as clearing rather than making it vanish', async () => {
      await clearBalance();
      await seedHeldRoyalty(5000);

      // A creator who made a sale and sees a zero balance with no explanation
      // reasonably concludes they were not credited.
      const clearing = await getClearingBalance(creatorId);
      expect(clearing.totalCents).toBe(5000);
      expect(clearing.transactionCount).toBe(1);
      expect(clearing.nextAvailableAt).toBeTruthy();
      expect(new Date(clearing.nextAvailableAt!).getTime()).toBeGreaterThan(
        Date.now()
      );
    });

    it('refuses a payout funded only by held royalties', async () => {
      await clearBalance();
      await seedHeldRoyalty(5000);

      await expect(
        requestPayout({ userId: creatorId, amountCents: 5000 })
      ).rejects.toThrow(/Insufficient available balance/);
    });

    it('releases it once matured', async () => {
      await clearBalance();
      const heldId = await seedHeldRoyalty(5000);

      // Fast-forward past the hold rather than waiting 14 days.
      await supabase
        .from('sale_royalty_transactions')
        .update({
          available_at: new Date(Date.now() - 86_400_000).toISOString(),
        })
        .eq('id', heldId);

      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(5000);
      expect((await getClearingBalance(creatorId)).totalCents).toBe(0);

      const result = await requestPayout({
        userId: creatorId,
        amountCents: 5000,
      });
      expect(result.reservedCents).toBe(5000);
    });

    it('does not re-hold royalties returned by a reversal', async () => {
      await clearBalance();
      const id = await seedHeldRoyalty(3000);
      await supabase
        .from('sale_royalty_transactions')
        .update({
          available_at: new Date(Date.now() - 86_400_000).toISOString(),
        })
        .eq('id', id);

      const { payoutId } = await requestPayout({
        userId: creatorId,
        amountCents: 3000,
      });
      await settlePayout(payoutId, `tr_hold_${suffix}`);
      await reversePayout(`tr_hold_${suffix}`, 'reversed');

      // The sale is long settled and the money already moved once. Re-holding
      // would punish the creator for a reversal that is usually not their doing.
      expect((await getAvailablePayoutBalance(creatorId)).totalCents).toBe(3000);
      expect((await getClearingBalance(creatorId)).totalCents).toBe(0);
    });
  });

  describe('clients cannot bypass reservation', () => {
    it('refuses a payout inserted directly by an authenticated client', async () => {
      // 00005 granted every client INSERT on payouts, so one could be created with
      // an arbitrary amount and zero backing payout_items — sidestepping
      // request_payout() entirely, while execute.ts trusted amount_cents when it
      // called Stripe. This drives the real anon-key client, as a browser would.
      const email = `bypass-${suffix}@test.local`;
      const password = 'TestPassword123!';

      const { data: created } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      const attackerId = created!.user!.id;

      try {
        const client = createClient(
          import.meta.env.PUBLIC_SUPABASE_URL,
          import.meta.env.PUBLIC_SUPABASE_ANON_KEY
        );

        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        expect(signInError).toBeNull();

        const { data, error } = await client
          .from('payouts')
          .insert({
            user_id: attackerId,
            amount_cents: 999_999_99,
            currency: 'usd',
            status: 'pending',
          })
          .select();

        // RLS must reject this outright.
        expect(error).not.toBeNull();
        expect(data).toBeNull();

        // And nothing may have landed.
        const { data: rows } = await supabase
          .from('payouts')
          .select('id')
          .eq('user_id', attackerId);
        expect(rows?.length ?? 0).toBe(0);
      } finally {
        await supabase.auth.admin.deleteUser(attackerId);
      }
    });
  });
});
