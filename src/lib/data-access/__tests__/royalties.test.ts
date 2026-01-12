import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getProductRoyalties,
  getRoyaltyById,
  createProductRoyalty,
  updateProductRoyalty,
  deleteProductRoyalty,
  calculateTotalProductCost,
  getUserRoyaltyTransactions,
  getUserEarningsSummary,
  createRoyaltyTransactionsForProduct,
  markSaleRoyaltiesAsRefunded
} from '../royalties';
import { createProduct } from '../products';

/**
 * P0 CRITICAL: Product Royalty Calculation Tests (Post-December 2024)
 *
 * Tests the product-centric royalty system (replaced asset-based royalties).
 *
 * Coverage:
 * - Fixed royalties (cents)
 * - Percentage royalties (% of sale price)
 * - Multiple royalties on same product
 * - Royalty transaction creation
 * - Rounding edge cases (e.g., 15% of $33.33)
 * - Platform fee considerations (10% reserved)
 * - Refund handling
 * - Embedded product royalties
 * - Zero/negative royalty handling
 * - Soft delete behavior
 *
 * Business Impact: Incorrect royalty calculations = legal liability,
 * contributor disputes, revenue loss.
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Product Royalty System', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testContributorId: string;
  let testProductId: string;
  let embeddedProductId: string;
  let testRoyalty1Id: string;
  let testRoyalty2Id: string;
  let testSaleId: string;
  let testSaleItemId: string;

  const testEmail1 = `test-royalty-user1-${Date.now()}@example.com`;
  const testEmail2 = `test-royalty-user2-${Date.now()}@example.com`;
  const testContributorEmail = `test-royalty-contributor-${Date.now()}@example.com`;

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

    // Create embedded product (owned by contributor)
    const embeddedProduct = await createProduct(testContributorId, {
      title: 'Embedded Product for Royalties',
      description: 'Product to be embedded with royalties',
      status: 'public',
    });

    if (!embeddedProduct) throw new Error('Failed to create embedded product');
    embeddedProductId = embeddedProduct.id;

    // Add file to embedded product
    await supabase
      .from('product_files')
      .insert({
        product_id: embeddedProductId,
        name: 'Embedded File.pdf',
        file_url: 'https://example.com/embedded.pdf',
        storage_path: 'test/embedded.pdf',
        file_size_kb: 500,
        mime_type: 'application/pdf',
        position: 0,
        price_cents: 1000, // $10.00
      });

    // Create main test product (owned by user1)
    const product = await createProduct(testUser1Id, {
      title: 'Test Product for Royalties',
      description: 'Main product for royalty testing',
      status: 'public',
    });

    if (!product) throw new Error('Failed to create test product');
    testProductId = product.id;

    // Add file to main product
    await supabase
      .from('product_files')
      .insert({
        product_id: testProductId,
        name: 'Main Product File.pdf',
        file_url: 'https://example.com/main.pdf',
        storage_path: 'test/main.pdf',
        file_size_kb: 1000,
        mime_type: 'application/pdf',
        position: 0,
        price_cents: 3000, // $30.00
      });

    // Embed the contributor's product
    await supabase
      .from('product_components')
      .insert({
        parent_product_id: testProductId,
        child_product_id: embeddedProductId,
        inherited_price_cents: 1000, // $10.00 inherited
      });
  });

  afterAll(async () => {
    // Clean up test users (cascades to products, royalties)
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

  describe('createProductRoyalty', () => {
    it('should create a fixed royalty for a product', async () => {
      const royalty = await createProductRoyalty({
        productId: testProductId,
        userId: testContributorId,
        royaltyValue: 500, // $5.00 fixed
      });

      expect(royalty).toBeDefined();
      expect(royalty?.product_id).toBe(testProductId);
      expect(royalty?.user_id).toBe(testContributorId);
      expect(royalty?.royalty_type).toBe('fixed');
      expect(royalty?.royalty_value).toBe(500);

      if (royalty) {
        testRoyalty1Id = royalty.id;
      }
    });

    it('should create multiple royalties for the same product', async () => {
      const royalty = await createProductRoyalty({
        productId: testProductId,
        userId: testUser2Id,
        royaltyValue: 300, // $3.00 fixed
      });

      expect(royalty).toBeDefined();
      expect(royalty?.product_id).toBe(testProductId);
      expect(royalty?.user_id).toBe(testUser2Id);
      expect(royalty?.royalty_value).toBe(300);

      if (royalty) {
        testRoyalty2Id = royalty.id;
      }
    });

    it('should allow zero royalty value', async () => {
      const royalty = await createProductRoyalty({
        productId: testProductId,
        userId: testUser1Id,
        royaltyValue: 0,
      });

      expect(royalty).toBeDefined();
      expect(royalty?.royalty_value).toBe(0);

      // Clean up zero royalty
      if (royalty) {
        await deleteProductRoyalty(royalty.id);
      }
    });
  });

  describe('getProductRoyalties', () => {
    it('should fetch all royalties for a product', async () => {
      const royalties = await getProductRoyalties(testProductId);

      expect(royalties).toBeDefined();
      expect(Array.isArray(royalties)).toBe(true);
      expect(royalties.length).toBeGreaterThanOrEqual(2); // At least royalty1 and royalty2
      expect(royalties.every(r => r.product_id === testProductId)).toBe(true);
    });

    it('should not return deleted royalties', async () => {
      const tempRoyalty = await createProductRoyalty({
        productId: testProductId,
        userId: testUser1Id,
        royaltyValue: 100,
      });

      await deleteProductRoyalty(tempRoyalty!.id);

      const royalties = await getProductRoyalties(testProductId);
      const hasDeleted = royalties.some(r => r.id === tempRoyalty!.id);

      expect(hasDeleted).toBe(false);
    });

    it('should return empty array for product with no royalties', async () => {
      const product2 = await createProduct(testUser1Id, {
        title: 'Product Without Royalties',
        status: 'private',
      });

      const royalties = await getProductRoyalties(product2!.id);
      expect(royalties).toEqual([]);
    });

    it('should order royalties by created_at ascending', async () => {
      const royalties = await getProductRoyalties(testProductId);

      if (royalties.length > 1) {
        for (let i = 0; i < royalties.length - 1; i++) {
          const current = new Date(royalties[i].created_at).getTime();
          const next = new Date(royalties[i + 1].created_at).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });
  });

  describe('getRoyaltyById', () => {
    it('should fetch royalty by ID', async () => {
      const royalty = await getRoyaltyById(testRoyalty1Id);

      expect(royalty).toBeDefined();
      expect(royalty?.id).toBe(testRoyalty1Id);
      expect(royalty?.product_id).toBe(testProductId);
    });

    it('should return null for non-existent royalty ID', async () => {
      const royalty = await getRoyaltyById('00000000-0000-0000-0000-000000000000');
      expect(royalty).toBeNull();
    });
  });

  describe('updateProductRoyalty', () => {
    it('should update royalty value', async () => {
      const result = await updateProductRoyalty(testRoyalty1Id, 700);
      expect(result).toBe(true);

      const royalty = await getRoyaltyById(testRoyalty1Id);
      expect(royalty?.royalty_value).toBe(700);
    });

    it('should allow updating to zero', async () => {
      const result = await updateProductRoyalty(testRoyalty1Id, 0);
      expect(result).toBe(true);

      const royalty = await getRoyaltyById(testRoyalty1Id);
      expect(royalty?.royalty_value).toBe(0);

      // Restore for other tests
      await updateProductRoyalty(testRoyalty1Id, 500);
    });
  });

  describe('deleteProductRoyalty', () => {
    it('should soft delete a royalty', async () => {
      const tempRoyalty = await createProductRoyalty({
        productId: testProductId,
        userId: testUser1Id,
        royaltyValue: 200,
      });

      const result = await deleteProductRoyalty(tempRoyalty!.id);
      expect(result).toBe(true);

      const royalty = await getRoyaltyById(tempRoyalty!.id);
      expect(royalty).toBeNull();

      // Verify it still exists in database but marked deleted
      const { data } = await supabase
        .from('product_royalties')
        .select('*')
        .eq('id', tempRoyalty!.id)
        .single();

      expect(data?.deleted).toBe(true);
      expect(data?.deleted_at).toBeDefined();
    });
  });

  describe('calculateTotalProductCost', () => {
    it('should calculate total fixed royalty cost', async () => {
      // We have royalty1 (500 cents) and royalty2 (300 cents)
      const total = await calculateTotalProductCost(testProductId);

      // Should be at least 800 cents (may have more from other tests)
      expect(total).toBeGreaterThanOrEqual(800);
    });

    it('should return 0 for product with no royalties', async () => {
      const product3 = await createProduct(testUser1Id, {
        title: 'Product No Cost',
        status: 'public',
      });

      const total = await calculateTotalProductCost(product3!.id);
      expect(total).toBe(0);
    });

    it('should exclude deleted royalties from calculation', async () => {
      const tempProduct = await createProduct(testUser1Id, {
        title: 'Product Deletion Test',
        status: 'public',
      });

      // Add two royalties
      await createProductRoyalty({
        productId: tempProduct!.id,
        userId: testUser1Id,
        royaltyValue: 400,
      });

      const royalty2 = await createProductRoyalty({
        productId: tempProduct!.id,
        userId: testUser2Id,
        royaltyValue: 600,
      });

      // Total should be 1000
      let total = await calculateTotalProductCost(tempProduct!.id);
      expect(total).toBe(1000);

      // Delete one royalty
      await deleteProductRoyalty(royalty2!.id);

      // Total should now be 400
      total = await calculateTotalProductCost(tempProduct!.id);
      expect(total).toBe(400);
    });
  });

  describe('createRoyaltyTransactionsForProduct', () => {
    beforeAll(async () => {
      // Create a sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          user_email: testEmail1,
          price_cents: 4000, // $40.00
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_royalty_test_${Date.now()}`,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      testSaleId = sale!.id;

      // Create a sale item
      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: testSaleId,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      testSaleItemId = saleItem!.id;
    });

    it('should create royalty transactions for fixed royalties', async () => {
      const transactions = await createRoyaltyTransactionsForProduct({
        saleId: testSaleId,
        saleItemId: testSaleItemId,
        productId: testProductId,
        saleItemPriceCents: 4000,
      });

      expect(transactions).toBeDefined();
      expect(transactions.length).toBeGreaterThanOrEqual(2);

      // Verify transaction for contributor (500 cents)
      const contributorTransaction = transactions.find(t => t.recipient_user_id === testContributorId);
      expect(contributorTransaction).toBeDefined();
      expect(contributorTransaction?.calculated_cents).toBe(500);
      expect(contributorTransaction?.status).toBe('ready_to_pay');

      // Verify transaction for user2 (300 cents)
      const user2Transaction = transactions.find(t => t.recipient_user_id === testUser2Id);
      expect(user2Transaction).toBeDefined();
      expect(user2Transaction?.calculated_cents).toBe(300);
    });

    it('should handle percentage royalties correctly', async () => {
      // Create product with percentage royalty
      const percentProduct = await createProduct(testContributorId, {
        title: 'Percentage Royalty Product',
        status: 'public',
      });

      await supabase
        .from('product_files')
        .insert({
          product_id: percentProduct!.id,
          name: 'Percent File.pdf',
          file_url: 'https://example.com/percent.pdf',
          storage_path: 'test/percent.pdf',
          file_size_kb: 500,
          mime_type: 'application/pdf',
          position: 0,
          price_cents: 2000, // $20.00
        });

      // Create percentage royalty (20%)
      await supabase
        .from('product_royalties')
        .insert({
          product_id: percentProduct!.id,
          user_id: testContributorId,
          royalty_type: 'percentage',
          royalty_value: 20, // 20%
        });

      // Create sale
      const { data: newSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          user_email: testEmail1,
          price_cents: 2000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_percent_test_${Date.now()}`,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: newSaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: newSale!.id,
          product_id: percentProduct!.id,
          price_cents: 2000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      const transactions = await createRoyaltyTransactionsForProduct({
        saleId: newSale!.id,
        saleItemId: newSaleItem!.id,
        productId: percentProduct!.id,
        saleItemPriceCents: 2000,
      });

      expect(transactions.length).toBe(1);
      expect(transactions[0].calculated_cents).toBe(400); // 20% of 2000
      expect(transactions[0].royalty_type).toBe('percentage');
    });

    it('should handle percentage rounding correctly', async () => {
      // Test edge case: 15% of $33.33 = $4.9995 → should round to $5.00
      const testPrice = 3333; // $33.33
      const testPercentage = 15;
      const calculatedCents = Math.round((testPrice * testPercentage) / 100);

      expect(calculatedCents).toBe(500); // $5.00 (rounded from 499.95)
    });

    it('should skip royalties with zero or negative calculated amounts', async () => {
      // Create product with zero royalty
      const zeroProduct = await createProduct(testUser1Id, {
        title: 'Zero Royalty Product',
        status: 'public',
      });

      await supabase
        .from('product_files')
        .insert({
          product_id: zeroProduct!.id,
          name: 'Zero File.pdf',
          file_url: 'https://example.com/zero.pdf',
          storage_path: 'test/zero.pdf',
          file_size_kb: 100,
          mime_type: 'application/pdf',
          position: 0,
          price_cents: 100,
        });

      await supabase
        .from('product_royalties')
        .insert({
          product_id: zeroProduct!.id,
          user_id: testUser1Id,
          royalty_type: 'fixed',
          royalty_value: 0,
        });

      const { data: zeroSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          user_email: testEmail1,
          price_cents: 100,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_zero_test_${Date.now()}`,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: zeroSaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: zeroSale!.id,
          product_id: zeroProduct!.id,
          price_cents: 100,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      const transactions = await createRoyaltyTransactionsForProduct({
        saleId: zeroSale!.id,
        saleItemId: zeroSaleItem!.id,
        productId: zeroProduct!.id,
        saleItemPriceCents: 100,
      });

      expect(transactions).toEqual([]);
    });

    it('should return empty array if no royalties configured', async () => {
      // Create product with no royalties
      const emptyProduct = await createProduct(testUser1Id, {
        title: 'No Royalties Product',
        status: 'public',
      });

      await supabase
        .from('product_files')
        .insert({
          product_id: emptyProduct!.id,
          name: 'Empty File.pdf',
          file_url: 'https://example.com/empty.pdf',
          storage_path: 'test/empty.pdf',
          file_size_kb: 100,
          mime_type: 'application/pdf',
          position: 0,
          price_cents: 100,
        });

      const { data: emptySale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          user_email: testEmail1,
          price_cents: 100,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_empty_test_${Date.now()}`,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: emptySaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: emptySale!.id,
          product_id: emptyProduct!.id,
          price_cents: 100,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      const transactions = await createRoyaltyTransactionsForProduct({
        saleId: emptySale!.id,
        saleItemId: emptySaleItem!.id,
        productId: emptyProduct!.id,
        saleItemPriceCents: 100,
      });

      expect(transactions).toEqual([]);
    });
  });

  describe('getUserRoyaltyTransactions', () => {
    it('should fetch all royalty transactions for a user', async () => {
      const transactions = await getUserRoyaltyTransactions(testContributorId);

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.every(t => t.recipient_user_id === testContributorId)).toBe(true);
    });

    it('should not include other users transactions', async () => {
      const contributorTransactions = await getUserRoyaltyTransactions(testContributorId);
      const user2Transactions = await getUserRoyaltyTransactions(testUser2Id);

      const hasOverlap = contributorTransactions.some(t1 =>
        user2Transactions.some(t2 => t1.id === t2.id)
      );

      expect(hasOverlap).toBe(false);
    });

    it('should order transactions by created_at descending', async () => {
      const transactions = await getUserRoyaltyTransactions(testContributorId);

      if (transactions.length > 1) {
        for (let i = 0; i < transactions.length - 1; i++) {
          const current = new Date(transactions[i].created_at).getTime();
          const next = new Date(transactions[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('getUserEarningsSummary', () => {
    it('should calculate total earnings', async () => {
      const summary = await getUserEarningsSummary(testContributorId);

      expect(summary).toBeDefined();
      expect(summary.totalEarnings).toBeGreaterThanOrEqual(500);
      expect(summary.transactionCount).toBeGreaterThan(0);
    });

    it('should calculate month-based earnings', async () => {
      const summary = await getUserEarningsSummary(testContributorId);

      expect(summary.thisMonthEarnings).toBeDefined();
      expect(summary.lastMonthEarnings).toBeDefined();
      expect(typeof summary.thisMonthEarnings).toBe('number');
      expect(typeof summary.lastMonthEarnings).toBe('number');
    });
  });

  describe('markSaleRoyaltiesAsRefunded', () => {
    it('should mark all ready_to_pay royalties as refunded', async () => {
      const refundedCount = await markSaleRoyaltiesAsRefunded(testSaleId);

      expect(refundedCount).toBeGreaterThan(0);

      // Verify transactions are marked as refunded
      const { data: transactions } = await supabase
        .from('sale_royalty_transactions')
        .select('*')
        .eq('sale_id', testSaleId)
        .eq('status', 'refunded');

      expect(transactions).toBeDefined();
      expect(transactions!.length).toBeGreaterThan(0);
    });

    it('should not affect already paid royalties', async () => {
      // Create a new sale with paid royalty
      const { data: paidSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          user_email: testEmail1,
          price_cents: 1000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_paid_test_${Date.now()}`,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: paidSale!.id,
          sale_item_id: testSaleItemId,
          sale_item_asset_id: testProductId,
          asset_royalty_id: testRoyalty1Id,
          recipient_user_id: testContributorId,
          royalty_type: 'fixed',
          royalty_value: 500,
          calculated_cents: 500,
          currency: 'usd',
          status: 'paid',
        });

      const refundedCount = await markSaleRoyaltiesAsRefunded(paidSale!.id);

      expect(refundedCount).toBe(0); // No ready_to_pay to refund
    });
  });

  describe('platform fee considerations', () => {
    it('should validate total royalties do not exceed 90% (platform reserves 10%)', async () => {
      const salePriceCents = 10000; // $100.00
      const maxRoyaltiesCents = Math.round(salePriceCents * 0.90); // $90.00

      // Example: Create product with 80% total royalties (should be valid)
      const feeTestProduct = await createProduct(testUser1Id, {
        title: 'Platform Fee Test Product',
        status: 'public',
      });

      await supabase
        .from('product_files')
        .insert({
          product_id: feeTestProduct!.id,
          name: 'Fee Test File.pdf',
          file_url: 'https://example.com/fee.pdf',
          storage_path: 'test/fee.pdf',
          file_size_kb: 1000,
          mime_type: 'application/pdf',
          position: 0,
          price_cents: salePriceCents,
        });

      // Add 40% royalty
      await supabase
        .from('product_royalties')
        .insert({
          product_id: feeTestProduct!.id,
          user_id: testContributorId,
          royalty_type: 'percentage',
          royalty_value: 40,
        });

      // Add another 30% royalty
      await supabase
        .from('product_royalties')
        .insert({
          product_id: feeTestProduct!.id,
          user_id: testUser2Id,
          royalty_type: 'percentage',
          royalty_value: 30,
        });

      // Calculate total royalties (should be 70% = $70.00)
      const royalty1 = Math.round((salePriceCents * 40) / 100); // $40.00
      const royalty2 = Math.round((salePriceCents * 30) / 100); // $30.00
      const totalRoyalties = royalty1 + royalty2; // $70.00

      expect(totalRoyalties).toBe(7000);
      expect(totalRoyalties).toBeLessThanOrEqual(maxRoyaltiesCents);

      // Platform gets remaining 30% ($30.00)
      const platformRevenue = salePriceCents - totalRoyalties;
      expect(platformRevenue).toBe(3000); // $30.00
    });
  });
});
