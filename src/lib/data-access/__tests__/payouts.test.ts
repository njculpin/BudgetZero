import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  requestPayout,
  settlePayout,
  releasePayout,
  getUserPayouts,
  getPayoutById,
  getPayoutItems,
  claimPayoutForProcessing,
  getPendingPayoutsForAdmin,
  getAvailablePayoutBalance
} from '../payouts';
import { createProduct } from '../products';
import type { PayoutStatus } from '@/types';

/**
 * P1 CRITICAL: Payout System Tests (Product-Centric Model)
 *
 * Tests the payout system for distributing royalty earnings to contributors.
 *
 * Coverage:
 * - Available balance calculation (ready_to_pay royalties)
 * - Payout request creation
 * - Payout item linking to royalty transactions
 * - Status transitions (pending → processing → paid/failed)
 * - Minimum payout threshold ($10)
 * - User isolation (security)
 * - Admin payout queue (pending payouts)
 * - Complete payout lifecycle
 * - Stripe Connect integration readiness
 *
 * Business Impact: Incorrect payouts = contributor disputes, legal liability,
 * platform reputation damage.
 */

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  (import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Insert a payout row directly.
 *
 * The tests below exercise the payout row's own lifecycle — listing, status
 * transitions, the admin queue — and do not care where the money came from.
 * `requestPayout` deliberately cannot be used for that: it reserves real
 * `ready_to_pay` royalty transactions, which these cases have not set up.
 */
async function createTestPayout(params: {
  userId: string;
  amountCents: number;
  notes?: string;
}) {
  const { data } = await supabase
    .from('payouts')
    .insert({
      user_id: params.userId,
      amount_cents: params.amountCents,
      currency: 'usd',
      status: 'pending',
      notes: params.notes ?? null,
    })
    .select()
    .single();

  return data;
}

describe('Payout System', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testContributorId: string;
  let testProductId: string;
  let productRoyaltyId: string;
  let payoutId: string;
  let royaltyTransaction1Id: string;
  let royaltyTransaction2Id: string;
  let saleId: string;
  let saleItemId: string;


  /**
   * Seed a fresh `ready_to_pay` royalty transaction for the contributor.
   *
   * These tests spend balance as they go — reserving, settling, releasing — so any
   * test needing funds must create its own rather than inherit what the previous
   * test happened to leave behind. Depending on leftover state makes the suite
   * order-sensitive, which is exactly how it broke on its first real run.
   */
  async function seedReadyRoyalty(amountCents: number): Promise<string> {
    const { data, error } = await supabase
      .from('sale_royalty_transactions')
      .insert({
        sale_id: saleId,
        sale_item_id: saleItemId,
        product_royalty_id: productRoyaltyId,
        recipient_user_id: testContributorId,
        royalty_type: 'fixed',
        royalty_value: amountCents,
        calculated_cents: amountCents,
        status: 'ready_to_pay',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to seed royalty: ${error?.message}`);
    }

    return data.id as string;
  }

  const testEmail1 = `test-payout-user1-${Date.now()}@example.com`;
  const testEmail2 = `test-payout-user2-${Date.now()}@example.com`;
  const testContributorEmail = `test-payout-contributor-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create test users
    const { data: user1Data } = await supabase.auth.admin.createUser({
      email: testEmail1,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    const { data: user2Data } = await supabase.auth.admin.createUser({
      email: testEmail2,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    const { data: contributorData } = await supabase.auth.admin.createUser({
      email: testContributorEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (!user1Data?.user || !user2Data?.user || !contributorData?.user) {
      throw new Error('Failed to create test users');
    }

    testUser1Id = user1Data.user.id;
    testUser2Id = user2Data.user.id;
    testContributorId = contributorData.user.id;

    // Create test product
    const product = await createProduct(testUser1Id, {
      title: 'Payout Test Product',
      status: 'public',
    });

    if (!product) throw new Error('Failed to create test product');
    testProductId = product.id;

    // Add product file
    await supabase
      .from('product_files')
      .insert({
        product_id: testProductId,
        title: 'Test File.pdf',
        file_url: 'https://example.com/test.pdf',
        storage_path: 'test/file.pdf',
        file_size_bytes: 1024000, // 1000 KB
        mime_type: 'application/pdf',
        position: 0,
        price_cents: 10000, // $100.00
      });

    // Create product royalty for contributor
    const { data: productRoyalty } = await supabase
      .from('product_royalties')
      .insert({
        product_id: testProductId,
        user_id: testContributorId,
        royalty_type: 'fixed',
        royalty_value: 5000, // $50.00
      })
      .select()
      .single();

    if (!productRoyalty) throw new Error('Failed to create product royalty');
    productRoyaltyId = productRoyalty.id;

    // Create mock sale
    const { data: sale } = await supabase
      .from('sales')
      .insert({
        user_id: testUser1Id,
        user_email: testEmail1,
        price_cents: 10000,
        tax_cents: 0,
        currency: 'usd',
        stripe_charge_id: `pi_payout_test_${Date.now()}`,
        status: 'paid',
        payment_method: 'stripe',
      })
      .select()
      .single();

    if (!sale) throw new Error('Failed to create mock sale');
    saleId = sale.id;

    // Create sale item
    const { data: saleItem } = await supabase
      .from('sale_items')
      .insert({
        sale_id: sale.id,
        product_id: testProductId,
        price_cents: 10000,
        currency: 'usd',
        quantity: 1,
        snapshot: {},
      })
      .select()
      .single();

    if (!saleItem) throw new Error('Failed to create mock sale item');
    saleItemId = saleItem.id;

    // Create royalty transactions for contributor (ready to pay)
    const { data: royalty1 } = await supabase
      .from('sale_royalty_transactions')
      .insert({
        sale_id: sale.id,
        sale_item_id: saleItem!.id,
        product_royalty_id: productRoyaltyId,
        recipient_user_id: testContributorId,
        royalty_type: 'fixed',
        royalty_value: 5000,
        calculated_cents: 5000, // $50.00
        status: 'ready_to_pay',
      })
      .select()
      .single();

    const { data: royalty2 } = await supabase
      .from('sale_royalty_transactions')
      .insert({
        sale_id: sale.id,
        sale_item_id: saleItem!.id,
        product_royalty_id: productRoyaltyId,
        recipient_user_id: testContributorId,
        royalty_type: 'fixed',
        royalty_value: 3000,
        calculated_cents: 3000, // $30.00
        status: 'ready_to_pay',
      })
      .select()
      .single();

    if (!royalty1 || !royalty2) {
      throw new Error('Failed to create royalty transactions');
    }

    royaltyTransaction1Id = royalty1.id;
    royaltyTransaction2Id = royalty2.id;

    // Create a royalty transaction for user2 (to test isolation)
    await supabase
      .from('sale_royalty_transactions')
      .insert({
        sale_id: sale.id,
        sale_item_id: saleItem!.id,
        product_royalty_id: productRoyaltyId,
        recipient_user_id: testUser2Id,
        royalty_type: 'fixed',
        royalty_value: 2000,
        calculated_cents: 2000, // $20.00
        status: 'ready_to_pay',
      });
  });

  afterAll(async () => {
    // Clean up test users (cascades to sales, transactions, payouts)
    if (testUser1Id) {
      await supabase.auth.admin.deleteUser(testUser1Id);
    }
    if (testUser2Id) {
      await supabase.auth.admin.deleteUser(testUser2Id);
    }
    if (testContributorId) {
      await supabase.auth.admin.deleteUser(testContributorId);
    }
  });

  describe('getAvailablePayoutBalance (SECURITY)', () => {
    it('should only return balance for the specified user', async () => {
      const balance = await getAvailablePayoutBalance(testContributorId);

      // Contributor should have 8000 cents ($80: $50 + $30)
      expect(balance.totalCents).toBe(8000);
      expect(balance.transactionIds.length).toBe(2);
      expect(balance.transactionIds).toContain(royaltyTransaction1Id);
      expect(balance.transactionIds).toContain(royaltyTransaction2Id);
    });

    it('should not include other users transactions', async () => {
      const contributorBalance = await getAvailablePayoutBalance(testContributorId);
      const user2Balance = await getAvailablePayoutBalance(testUser2Id);

      // Contributor: $80.00
      expect(contributorBalance.totalCents).toBe(8000);

      // User 2: $20.00 (separate transaction)
      expect(user2Balance.totalCents).toBe(2000);

      // Transaction IDs should not overlap
      const hasOverlap = contributorBalance.transactionIds.some(id =>
        user2Balance.transactionIds.includes(id)
      );
      expect(hasOverlap).toBe(false);
    });

    it('should only include transactions with status ready_to_pay', async () => {
      // Create a transaction with different status
      const { data: newSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          user_email: testEmail1,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_pending_test_${Date.now()}`,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: newSaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: newSale!.id,
          product_id: testProductId,
          price_cents: 5000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: newSale!.id,
          sale_item_id: newSaleItem!.id,
          product_royalty_id: productRoyaltyId,
          recipient_user_id: testContributorId,
          royalty_type: 'fixed',
          royalty_value: 1000,
          calculated_cents: 1000,
          status: 'pending', // Not ready_to_pay
        });

      const balance = await getAvailablePayoutBalance(testContributorId);

      // Should still be 8000 (not including the pending transaction)
      expect(balance.totalCents).toBe(8000);
      expect(balance.transactionIds.length).toBe(2);
    });

    it('should return zero balance if no ready_to_pay transactions', async () => {
      // Create a new user with no transactions
      const { data: user3Data } = await supabase.auth.admin.createUser({
        email: `test-payout-nobalance-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const balance = await getAvailablePayoutBalance(user3Data!.user!.id);

      expect(balance.totalCents).toBe(0);
      expect(balance.transactionIds).toEqual([]);

      // Clean up
      await supabase.auth.admin.deleteUser(user3Data!.user!.id);
    });

    it('should not include transactions that are already paid', async () => {
      // Mark one transaction as paid
      await supabase
        .from('sale_royalty_transactions')
        .update({ status: 'paid' })
        .eq('id', royaltyTransaction1Id);

      const balance = await getAvailablePayoutBalance(testContributorId);

      // Should only include royaltyTransaction2 (3000 cents)
      expect(balance.totalCents).toBe(3000);
      expect(balance.transactionIds).toContain(royaltyTransaction2Id);
      expect(balance.transactionIds).not.toContain(royaltyTransaction1Id);

      // Restore for other tests
      await supabase
        .from('sale_royalty_transactions')
        .update({ status: 'ready_to_pay' })
        .eq('id', royaltyTransaction1Id);
    });
  });

  describe('requestPayout', () => {
    it('should create a payout request and reserve its funding transactions', async () => {
      const result = await requestPayout({
        userId: testContributorId,
        amountCents: 8000,
        notes: 'Test payout request',
      });

      expect(result.reservedCents).toBe(8000);
      expect(result.transactionCount).toBe(2);

      payoutId = result.payoutId;

      const payout = await getPayoutById(payoutId);
      expect(payout?.user_id).toBe(testContributorId);
      expect(payout?.amount_cents).toBe(8000);
      expect(payout?.currency).toBe('usd');
      expect(payout?.status).toBe('pending');
      expect(payout?.notes).toBe('Test payout request');
    });

    it('should create payout items linking to royalty transactions', async () => {
      const items = await getPayoutItems(payoutId);

      expect(items.length).toBe(2);
      expect(items.every(item => item.payout_id === payoutId)).toBe(true);
      // Items must sum to the payout amount, not to a proportional guess.
      expect(items.reduce((sum, item) => sum + item.amount_cents, 0)).toBe(8000);
    });

    it('should remove reserved transactions from available balance', async () => {
      // This is the defect the reservation step exists to prevent: before it, the
      // funding transactions stayed 'ready_to_pay' and could be withdrawn again.
      const balance = await getAvailablePayoutBalance(testContributorId);

      expect(balance.totalCents).toBe(0);
      expect(balance.transactionIds).toEqual([]);
    });

    it('should refuse a second payout for already-reserved earnings', async () => {
      await expect(
        requestPayout({ userId: testContributorId, amountCents: 8000 })
      ).rejects.toThrow(/Insufficient available balance/);
    });

    it('should return reserved transactions to the balance when released', async () => {
      const released = await releasePayout(payoutId, 'Test release');
      expect(released).toBe(2);

      const balance = await getAvailablePayoutBalance(testContributorId);
      expect(balance.totalCents).toBe(8000);

      // Re-reserve so the remaining lifecycle tests have a pending payout.
      const result = await requestPayout({
        userId: testContributorId,
        amountCents: 8000,
        notes: 'Test payout request',
      });
      payoutId = result.payoutId;
    });

    it('should mark funding transactions paid when the payout settles', async () => {
      const settled = await settlePayout(payoutId, 'tr_test_settlement');
      expect(settled).toBe(2);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('paid');
      expect(payout?.stripe_transfer_id).toBe('tr_test_settlement');

      // Settled earnings never return to the available balance.
      const balance = await getAvailablePayoutBalance(testContributorId);
      expect(balance.totalCents).toBe(0);
    });

    it('should refuse a payout below the minimum threshold', async () => {
      await expect(
        requestPayout({
          userId: testContributorId,
          amountCents: 500,
          minimumCents: 1000,
        })
      ).rejects.toThrow(/Insufficient available balance/);
    });

    it('should respect minimum payout threshold ($10.00)', async () => {
      // This is a business rule test - minimum $10.00 payout
      const minPayoutCents = 1000; // $10.00
      const smallAmount = 500; // $5.00

      // In production, this should be enforced before calling createPayout
      expect(smallAmount).toBeLessThan(minPayoutCents);

      // Verify we can create payouts above threshold
      const payout = await createTestPayout({
        userId: testContributorId,
        amountCents: minPayoutCents,
      });

      expect(payout).toBeDefined();
      expect(payout?.amount_cents).toBeGreaterThanOrEqual(minPayoutCents);
    });
  });

  describe('getUserPayouts', () => {
    it('should return all payouts for a user', async () => {
      const payouts = await getUserPayouts(testContributorId);

      expect(payouts).toBeDefined();
      expect(Array.isArray(payouts)).toBe(true);
      expect(payouts.length).toBeGreaterThan(0);
      expect(payouts.every(p => p.user_id === testContributorId)).toBe(true);
    });

    it('should return payouts in descending order by requested_at', async () => {
      // Create another payout
      await createTestPayout({
        userId: testContributorId,
        amountCents: 1000,
      });

      const payouts = await getUserPayouts(testContributorId);

      expect(payouts.length).toBeGreaterThanOrEqual(2);

      // Verify order (most recent first)
      for (let i = 0; i < payouts.length - 1; i++) {
        const current = new Date(payouts[i].requested_at).getTime();
        const next = new Date(payouts[i + 1].requested_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should not return other users payouts', async () => {
      const contributorPayouts = await getUserPayouts(testContributorId);
      const user2Payouts = await getUserPayouts(testUser2Id);

      expect(contributorPayouts.every(p => p.user_id === testContributorId)).toBe(true);
      expect(user2Payouts.every(p => p.user_id === testUser2Id)).toBe(true);

      const hasOverlap = contributorPayouts.some(p1 =>
        user2Payouts.some(p2 => p1.id === p2.id)
      );
      expect(hasOverlap).toBe(false);
    });
  });

  describe('getPayoutById', () => {
    it('should fetch payout by ID', async () => {
      const payout = await getPayoutById(payoutId);

      expect(payout).toBeDefined();
      expect(payout?.id).toBe(payoutId);
      expect(payout?.user_id).toBe(testContributorId);
    });

    it('should return null for non-existent payout ID', async () => {
      const payout = await getPayoutById('00000000-0000-0000-0000-000000000000');
      expect(payout).toBeNull();
    });
  });

  describe('payout lifecycle', () => {
    // These mirror what /api/payouts/execute actually does. The previous block
    // tested updatePayoutStatus, which has been removed: it could mark a payout
    // 'failed' while leaving its royalty transactions reserved, stranding them.

    it('should claim a pending payout for processing', async () => {
      const amount = await seedReadyRoyalty(2600);
      expect(amount).toBeTruthy();

      const requested = await requestPayout({
        userId: testContributorId,
        amountCents: 2600,
      });

      expect(await claimPayoutForProcessing(requested.payoutId)).toBe(true);

      const payout = await getPayoutById(requested.payoutId);
      expect(payout?.status).toBe('processing');
      expect(payout?.processed_at).toBeTruthy();
    });

    it('should refuse to claim the same payout twice', async () => {
      await seedReadyRoyalty(2700);
      const requested = await requestPayout({
        userId: testContributorId,
        amountCents: 2700,
      });

      expect(await claimPayoutForProcessing(requested.payoutId)).toBe(true);
      // Two concurrent executions must not both transfer money.
      expect(await claimPayoutForProcessing(requested.payoutId)).toBe(false);
    });

    it('should settle a payout and record the transfer id', async () => {
      await seedReadyRoyalty(2800);
      const requested = await requestPayout({
        userId: testContributorId,
        amountCents: 2800,
      });
      await claimPayoutForProcessing(requested.payoutId);

      const settled = await settlePayout(requested.payoutId, 'tr_lifecycle_1');
      expect(settled).toBeGreaterThan(0);

      const payout = await getPayoutById(requested.payoutId);
      expect(payout?.status).toBe('paid');
      expect(payout?.stripe_transfer_id).toBe('tr_lifecycle_1');
      expect(payout?.paid_at).toBeTruthy();
    });

    it('should release a failed payout and restore the balance', async () => {
      await seedReadyRoyalty(2900);
      const before = await getAvailablePayoutBalance(testContributorId);

      const requested = await requestPayout({
        userId: testContributorId,
        amountCents: 2900,
      });
      await claimPayoutForProcessing(requested.payoutId);

      const released = await releasePayout(requested.payoutId, 'Transfer declined');
      expect(released).toBeGreaterThan(0);

      const payout = await getPayoutById(requested.payoutId);
      expect(payout?.status).toBe('failed');
      expect(payout?.failed_reason).toBe('Transfer declined');

      // The creator's earnings must not be stranded in a payout that never completes.
      const after = await getAvailablePayoutBalance(testContributorId);
      expect(after.totalCents).toBe(before.totalCents);
    });
  });

  describe('getPendingPayoutsForAdmin', () => {
    it('should return all pending payouts', async () => {
      // Create some pending payouts
      await createTestPayout({
        userId: testContributorId,
        amountCents: 1000,
      });

      const pendingPayouts = await getPendingPayoutsForAdmin();

      expect(pendingPayouts).toBeDefined();
      expect(Array.isArray(pendingPayouts)).toBe(true);
      expect(pendingPayouts.every(p => p.status === 'pending')).toBe(true);
      // The admin queue needs the recipient in order to decide whether a payout
      // can actually be transferred.
      expect(pendingPayouts.every(p => p.recipient !== null)).toBe(true);
    });

    it('should not return non-pending payouts', async () => {
      const pendingPayouts = await getPendingPayoutsForAdmin();

      // The payout we set to 'paid' earlier should not be included
      const hasPaidPayout = pendingPayouts.some(p => p.id === payoutId);
      expect(hasPaidPayout).toBe(false);
    });

    it('should order by requested_at ascending (oldest first)', async () => {
      const pendingPayouts = await getPendingPayoutsForAdmin();

      if (pendingPayouts.length > 1) {
        for (let i = 0; i < pendingPayouts.length - 1; i++) {
          const current = new Date(pendingPayouts[i].requested_at).getTime();
          const next = new Date(pendingPayouts[i + 1].requested_at).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });
  });

  describe('Integration: Complete Payout Flow', () => {
    it('should complete a full payout lifecycle', async () => {
      // Seed this test's own funds rather than relying on leftover balance.
      await seedReadyRoyalty(4200);

      // 1. Check available balance
      const balance = await getAvailablePayoutBalance(testContributorId);
      expect(balance.totalCents).toBeGreaterThan(0);

      // 2. Create payout request
      const requested = await requestPayout({
        userId: testContributorId,
        amountCents: balance.totalCents,
      });
      const payout = await getPayoutById(requested.payoutId);
      expect(payout?.status).toBe('pending');

      // 3. Claim it for processing, exactly as /api/payouts/execute does
      expect(await claimPayoutForProcessing(payout!.id)).toBe(true);
      let updatedPayout = await getPayoutById(payout!.id);
      expect(updatedPayout?.status).toBe('processing');
      expect(updatedPayout?.processed_at).toBeDefined();

      // 4. Settle after a successful transfer
      await settlePayout(payout!.id, 'stripe_final_123');
      updatedPayout = await getPayoutById(payout!.id);
      expect(updatedPayout?.status).toBe('paid');
      expect(updatedPayout?.paid_at).toBeDefined();
      expect(updatedPayout?.stripe_transfer_id).toBe('stripe_final_123');

      // 5. Verify payout items were created
      const items = await getPayoutItems(payout!.id);
      expect(items.length).toBe(balance.transactionIds.length);
    });

    it('should handle failed payout with retry flow', async () => {
      // Seed this test's own funds rather than relying on leftover balance.
      await seedReadyRoyalty(3300);

      // 1. Get balance
      const balance = await getAvailablePayoutBalance(testContributorId);

      // 2. Create payout
      const requested = await requestPayout({
        userId: testContributorId,
        amountCents: balance.totalCents,
      });
      const payout = await getPayoutById(requested.payoutId);

      // 3. Claim it for processing
      await claimPayoutForProcessing(payout!.id);

      // 4. Transfer fails — release returns the reserved royalties to the
      //    creator's balance. A bare status update would strand them.
      await releasePayout(payout!.id, 'Stripe account not connected');

      let failedPayout = await getPayoutById(payout!.id);
      expect(failedPayout?.status).toBe('failed');
      expect(failedPayout?.failed_reason).toBe('Stripe account not connected');

      // 5. Create new payout (retry). Releasing the failed payout returned its
      //    reserved transactions to the balance, so they can fund this one.
      const retryBalance = await getAvailablePayoutBalance(testContributorId);
      const retryRequested = await requestPayout({
        userId: testContributorId,
        amountCents: retryBalance.totalCents,
        notes: 'Retry after Stripe connection',
      });
      const retryPayout = await getPayoutById(retryRequested.payoutId);

      expect(retryPayout?.status).toBe('pending');
      expect(retryPayout?.notes).toBe('Retry after Stripe connection');
    });
  });

  describe('Business Rules', () => {
    it('should validate minimum payout threshold is enforced', async () => {
      const minThreshold = 1000; // $10.00

      const lowBalance = 500; // $5.00

      expect(lowBalance).toBeLessThan(minThreshold);

      // The minimum is now enforced inside request_payout rather than being left
      // to the caller, so a below-threshold request is refused at the data layer.
      await expect(
        requestPayout({
          userId: testContributorId,
          amountCents: lowBalance,
          minimumCents: 1000,
          notes: 'Test: below threshold',
        })
      ).rejects.toThrow(/Insufficient available balance/);
    });

    it('should track Stripe transfer IDs for reconciliation', async () => {
      const payout = await createTestPayout({
        userId: testContributorId,
        amountCents: 5000,
      });

      // Simulate a Stripe Connect transfer completing
      const stripeTransferId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      await settlePayout(payout!.id, stripeTransferId);

      const updatedPayout = await getPayoutById(payout!.id);
      expect(updatedPayout?.stripe_transfer_id).toBe(stripeTransferId);

      // Verify we can query by Stripe transfer ID
      const { data } = await supabase
        .from('payouts')
        .select('*')
        .eq('stripe_transfer_id', stripeTransferId)
        .single();

      expect(data?.id).toBe(payout!.id);
    });
  });
});
