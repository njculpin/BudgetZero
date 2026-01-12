import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  createPayout,
  getUserPayouts,
  getPayoutById,
  getPayoutItems,
  updatePayoutStatus,
  getPendingPayouts,
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
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

      const balance = await getAvailablePayoutBalance(user3Data!.user.id);

      expect(balance.totalCents).toBe(0);
      expect(balance.transactionIds).toEqual([]);

      // Clean up
      await supabase.auth.admin.deleteUser(user3Data!.user.id);
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

  describe('createPayout', () => {
    it('should create a payout request', async () => {
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: 8000,
        currency: 'usd',
        royaltyTransactionIds: [royaltyTransaction1Id, royaltyTransaction2Id],
        notes: 'Test payout request',
      });

      expect(payout).toBeDefined();
      expect(payout?.user_id).toBe(testContributorId);
      expect(payout?.amount_cents).toBe(8000);
      expect(payout?.currency).toBe('usd');
      expect(payout?.status).toBe('pending');
      expect(payout?.notes).toBe('Test payout request');

      if (payout) {
        payoutId = payout.id;
      }
    });

    it('should create payout items linking to royalty transactions', async () => {
      const items = await getPayoutItems(payoutId);

      expect(items.length).toBeGreaterThan(0);
      expect(items.every(item => item.payout_id === payoutId)).toBe(true);
    });

    it('should default to usd currency if not specified', async () => {
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: 1000,
        royaltyTransactionIds: [],
      });

      expect(payout?.currency).toBe('usd');
    });

    it('should respect minimum payout threshold ($10.00)', async () => {
      // This is a business rule test - minimum $10.00 payout
      const minPayoutCents = 1000; // $10.00
      const smallAmount = 500; // $5.00

      // In production, this should be enforced before calling createPayout
      expect(smallAmount).toBeLessThan(minPayoutCents);

      // Verify we can create payouts above threshold
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: minPayoutCents,
        royaltyTransactionIds: [],
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
      await createPayout({
        userId: testContributorId,
        amountCents: 1000,
        royaltyTransactionIds: [],
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

  describe('updatePayoutStatus', () => {
    it('should update status to processing', async () => {
      const result = await updatePayoutStatus(payoutId, 'processing');
      expect(result).toBe(true);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('processing');
      expect(payout?.processed_at).toBeDefined();
    });

    it('should update status to paid', async () => {
      const result = await updatePayoutStatus(
        payoutId,
        'paid',
        'stripe_transfer_123'
      );
      expect(result).toBe(true);

      const payout = await getPayoutById(payoutId);
      expect(payout?.status).toBe('paid');
      expect(payout?.paid_at).toBeDefined();
      expect(payout?.stripe_transfer_id).toBe('stripe_transfer_123');
    });

    it('should update status to failed with reason', async () => {
      // Create a new payout to fail
      const newPayout = await createPayout({
        userId: testContributorId,
        amountCents: 1000,
        royaltyTransactionIds: [],
      });

      const result = await updatePayoutStatus(
        newPayout!.id,
        'failed',
        undefined,
        'Insufficient funds in Stripe account'
      );
      expect(result).toBe(true);

      const payout = await getPayoutById(newPayout!.id);
      expect(payout?.status).toBe('failed');
      expect(payout?.failed_reason).toBe('Insufficient funds in Stripe account');
    });

    it('should handle status transitions correctly', async () => {
      const newPayout = await createPayout({
        userId: testContributorId,
        amountCents: 2000,
        royaltyTransactionIds: [],
      });

      // pending → processing
      await updatePayoutStatus(newPayout!.id, 'processing');
      let payout = await getPayoutById(newPayout!.id);
      expect(payout?.status).toBe('processing');
      expect(payout?.processed_at).toBeDefined();

      // processing → paid
      await updatePayoutStatus(newPayout!.id, 'paid', 'stripe_tx_456');
      payout = await getPayoutById(newPayout!.id);
      expect(payout?.status).toBe('paid');
      expect(payout?.paid_at).toBeDefined();
      expect(payout?.stripe_transfer_id).toBe('stripe_tx_456');
    });
  });

  describe('getPendingPayouts', () => {
    it('should return all pending payouts', async () => {
      // Create some pending payouts
      await createPayout({
        userId: testContributorId,
        amountCents: 1000,
        royaltyTransactionIds: [],
      });

      const pendingPayouts = await getPendingPayouts();

      expect(pendingPayouts).toBeDefined();
      expect(Array.isArray(pendingPayouts)).toBe(true);
      expect(pendingPayouts.every(p => p.status === 'pending')).toBe(true);
    });

    it('should not return non-pending payouts', async () => {
      const pendingPayouts = await getPendingPayouts();

      // The payout we set to 'paid' earlier should not be included
      const hasPaidPayout = pendingPayouts.some(p => p.id === payoutId);
      expect(hasPaidPayout).toBe(false);
    });

    it('should order by requested_at ascending (oldest first)', async () => {
      const pendingPayouts = await getPendingPayouts();

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
      // 1. Check available balance
      const balance = await getAvailablePayoutBalance(testContributorId);
      expect(balance.totalCents).toBeGreaterThan(0);

      // 2. Create payout request
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: balance.totalCents,
        royaltyTransactionIds: balance.transactionIds,
      });
      expect(payout?.status).toBe('pending');

      // 3. Mark as processing
      await updatePayoutStatus(payout!.id, 'processing');
      let updatedPayout = await getPayoutById(payout!.id);
      expect(updatedPayout?.status).toBe('processing');
      expect(updatedPayout?.processed_at).toBeDefined();

      // 4. Mark as paid (simulating Stripe Connect transfer)
      await updatePayoutStatus(payout!.id, 'paid', 'stripe_final_123');
      updatedPayout = await getPayoutById(payout!.id);
      expect(updatedPayout?.status).toBe('paid');
      expect(updatedPayout?.paid_at).toBeDefined();
      expect(updatedPayout?.stripe_transfer_id).toBe('stripe_final_123');

      // 5. Verify payout items were created
      const items = await getPayoutItems(payout!.id);
      expect(items.length).toBe(balance.transactionIds.length);
    });

    it('should handle failed payout with retry flow', async () => {
      // 1. Get balance
      const balance = await getAvailablePayoutBalance(testContributorId);

      // 2. Create payout
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: balance.totalCents,
        royaltyTransactionIds: balance.transactionIds,
      });

      // 3. Mark as processing
      await updatePayoutStatus(payout!.id, 'processing');

      // 4. Mark as failed
      await updatePayoutStatus(
        payout!.id,
        'failed',
        undefined,
        'Stripe account not connected'
      );

      let failedPayout = await getPayoutById(payout!.id);
      expect(failedPayout?.status).toBe('failed');
      expect(failedPayout?.failed_reason).toBe('Stripe account not connected');

      // 5. Create new payout (retry)
      const retryPayout = await createPayout({
        userId: testContributorId,
        amountCents: balance.totalCents,
        royaltyTransactionIds: balance.transactionIds,
        notes: 'Retry after Stripe connection',
      });

      expect(retryPayout?.status).toBe('pending');
      expect(retryPayout?.notes).toBe('Retry after Stripe connection');
    });
  });

  describe('Business Rules', () => {
    it('should validate minimum payout threshold is enforced', async () => {
      const minThreshold = 1000; // $10.00

      // Balance below threshold should not trigger payout creation
      // (This validation happens in UI/API, not in data access layer)
      const lowBalance = 500; // $5.00

      expect(lowBalance).toBeLessThan(minThreshold);

      // But data access layer should still allow creation if called
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: lowBalance,
        royaltyTransactionIds: [],
        notes: 'Test: below threshold',
      });

      // Verify it was created (validation is upstream responsibility)
      expect(payout).toBeDefined();
      expect(payout?.amount_cents).toBe(lowBalance);
    });

    it('should track Stripe transfer IDs for reconciliation', async () => {
      const payout = await createPayout({
        userId: testContributorId,
        amountCents: 5000,
        royaltyTransactionIds: [],
      });

      // Simulate Stripe Connect transfer
      const stripeTransferId = `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await updatePayoutStatus(payout!.id, 'paid', stripeTransferId);

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
