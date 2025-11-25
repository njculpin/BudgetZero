import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getAssetRoyalties,
  getRoyaltyById,
  createAssetRoyalty,
  updateAssetRoyalty,
  deleteAssetRoyalty,
  calculateTotalAssetCost,
  getUserRoyaltyTransactions,
  getUserEarningsSummary,
  getAssetEarningsBreakdown,
  getRoyaltyTransactionHistory,
  createRoyaltyTransactionsForSaleItemAsset,
  markSaleRoyaltiesAsRefunded
} from '../royalties';
import { createProduct, createVariant } from '../products';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Royalty Data Access Layer', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testProductId: string;
  let testVariantId: string;
  let testAssetId: string;
  let testRoyalty1Id: string;
  let testRoyalty2Id: string;
  let testSaleId: string;
  const testEmail1 = `test-royalty-1-${Date.now()}@example.com`;
  const testEmail2 = `test-royalty-2-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create two test users
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

    if (!user1Data?.user || !user2Data?.user) {
      throw new Error('Failed to create test users');
    }

    testUser1Id = user1Data.user.id;
    testUser2Id = user2Data.user.id;

    // Create a test product and variant
    const product = await createProduct(testUser1Id, {
      title: 'Test Product for Royalties',
      status: 'published',
    });

    if (!product) throw new Error('Failed to create test product');
    testProductId = product.id;

    const variant = await createVariant(testProductId, {
      title: 'Test Variant',
      sku: 'TEST-ROYALTY-001',
    });

    if (!variant) throw new Error('Failed to create test variant');
    testVariantId = variant.id;

    // Create a test asset
    const { data: asset } = await supabase
      .from('assets')
      .insert({
        user_id: testUser1Id,
        handle: 'test-asset-royalty',
        title: 'Test Asset for Royalties',
        description: 'Test asset',
        status: 'published',
      })
      .select()
      .single();

    if (!asset) throw new Error('Failed to create test asset');
    testAssetId = asset.id;
  });

  afterAll(async () => {
    // Clean up test users (cascades to products, assets, royalties)
    if (testUser1Id) {
      await supabase.auth.admin.deleteUser(testUser1Id);
    }
    if (testUser2Id) {
      await supabase.auth.admin.deleteUser(testUser2Id);
    }
  });

  describe('createAssetRoyalty', () => {
    it('should create a fixed royalty for an asset', async () => {
      const royalty = await createAssetRoyalty({
        assetId: testAssetId,
        userId: testUser1Id,
        royaltyValue: 500, // $5.00
      });

      expect(royalty).toBeDefined();
      expect(royalty?.asset_id).toBe(testAssetId);
      expect(royalty?.user_id).toBe(testUser1Id);
      expect(royalty?.royalty_type).toBe('fixed');
      expect(royalty?.royalty_value).toBe(500);

      if (royalty) {
        testRoyalty1Id = royalty.id;
      }
    });

    it('should create multiple royalties for the same asset', async () => {
      const royalty = await createAssetRoyalty({
        assetId: testAssetId,
        userId: testUser2Id,
        royaltyValue: 300, // $3.00
      });

      expect(royalty).toBeDefined();
      expect(royalty?.asset_id).toBe(testAssetId);
      expect(royalty?.user_id).toBe(testUser2Id);
      expect(royalty?.royalty_value).toBe(300);

      if (royalty) {
        testRoyalty2Id = royalty.id;
      }
    });

    it('should allow zero royalty value', async () => {
      const royalty = await createAssetRoyalty({
        assetId: testAssetId,
        userId: testUser1Id,
        royaltyValue: 0,
      });

      expect(royalty).toBeDefined();
      expect(royalty?.royalty_value).toBe(0);
    });
  });

  describe('getAssetRoyalties', () => {
    it('should fetch all royalties for an asset', async () => {
      const royalties = await getAssetRoyalties(testAssetId);

      expect(royalties).toBeDefined();
      expect(Array.isArray(royalties)).toBe(true);
      expect(royalties.length).toBeGreaterThanOrEqual(2);
      expect(royalties.every(r => r.asset_id === testAssetId)).toBe(true);
    });

    it('should not return deleted royalties', async () => {
      const tempRoyalty = await createAssetRoyalty({
        assetId: testAssetId,
        userId: testUser1Id,
        royaltyValue: 100,
      });

      await deleteAssetRoyalty(tempRoyalty!.id);

      const royalties = await getAssetRoyalties(testAssetId);
      const hasDeleted = royalties.some(r => r.id === tempRoyalty!.id);

      expect(hasDeleted).toBe(false);
    });

    it('should return empty array for asset with no royalties', async () => {
      const { data: asset2 } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-no-royalties',
          title: 'Asset Without Royalties',
          status: 'published',
        })
        .select()
        .single();

      const royalties = await getAssetRoyalties(asset2!.id);
      expect(royalties).toEqual([]);
    });

    it('should order royalties by created_at ascending', async () => {
      const royalties = await getAssetRoyalties(testAssetId);

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
      expect(royalty?.asset_id).toBe(testAssetId);
    });

    it('should return null for non-existent royalty ID', async () => {
      const royalty = await getRoyaltyById('00000000-0000-0000-0000-000000000000');
      expect(royalty).toBeNull();
    });
  });

  describe('updateAssetRoyalty', () => {
    it('should update royalty value', async () => {
      const result = await updateAssetRoyalty(testRoyalty1Id, 700);
      expect(result).toBe(true);

      const royalty = await getRoyaltyById(testRoyalty1Id);
      expect(royalty?.royalty_value).toBe(700);
    });

    it('should allow updating to zero', async () => {
      const result = await updateAssetRoyalty(testRoyalty1Id, 0);
      expect(result).toBe(true);

      const royalty = await getRoyaltyById(testRoyalty1Id);
      expect(royalty?.royalty_value).toBe(0);

      // Restore for other tests
      await updateAssetRoyalty(testRoyalty1Id, 500);
    });
  });

  describe('deleteAssetRoyalty', () => {
    it('should soft delete a royalty', async () => {
      const tempRoyalty = await createAssetRoyalty({
        assetId: testAssetId,
        userId: testUser1Id,
        royaltyValue: 200,
      });

      const result = await deleteAssetRoyalty(tempRoyalty!.id);
      expect(result).toBe(true);

      const royalty = await getRoyaltyById(tempRoyalty!.id);
      expect(royalty).toBeNull();

      // Verify it still exists in database but marked deleted
      const { data } = await supabase
        .from('asset_royalties')
        .select('*')
        .eq('id', tempRoyalty!.id)
        .single();

      expect(data?.deleted).toBe(true);
      expect(data?.deleted_at).toBeDefined();
    });
  });

  describe('P1 BUSINESS LOGIC: calculateTotalAssetCost', () => {
    it('should calculate total fixed royalty cost', async () => {
      // We have royalty1 (500 cents) and royalty2 (300 cents)
      const total = await calculateTotalAssetCost(testAssetId);

      // Should be at least 800 cents (may have more from other tests)
      expect(total).toBeGreaterThanOrEqual(800);
    });

    it('should return 0 for asset with no royalties', async () => {
      const { data: asset3 } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-no-cost',
          title: 'Asset No Cost',
          status: 'published',
        })
        .select()
        .single();

      const total = await calculateTotalAssetCost(asset3!.id);
      expect(total).toBe(0);
    });

    it('should exclude deleted royalties from calculation', async () => {
      const tempAsset = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-deletion-test',
          title: 'Asset Deletion Test',
          status: 'published',
        })
        .select()
        .single();

      // Add two royalties
      await createAssetRoyalty({
        assetId: tempAsset.data!.id,
        userId: testUser1Id,
        royaltyValue: 400,
      });

      const royalty2 = await createAssetRoyalty({
        assetId: tempAsset.data!.id,
        userId: testUser2Id,
        royaltyValue: 600,
      });

      // Total should be 1000
      let total = await calculateTotalAssetCost(tempAsset.data!.id);
      expect(total).toBe(1000);

      // Delete one royalty
      await deleteAssetRoyalty(royalty2!.id);

      // Total should now be 400
      total = await calculateTotalAssetCost(tempAsset.data!.id);
      expect(total).toBe(400);
    });
  });

  describe('P1 BUSINESS LOGIC: createRoyaltyTransactionsForSaleItemAsset', () => {
    let saleItemId: string;
    let saleItemAssetId: string;

    beforeAll(async () => {
      // Create a sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          total_cents: 2000,
          status: 'completed',
        })
        .select()
        .single();

      testSaleId = sale!.id;

      // Create a sale item
      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: testSaleId,
          variant_id: testVariantId,
          quantity: 1,
          unit_price_cents: 2000,
          snapshot: {},
        })
        .select()
        .single();

      saleItemId = saleItem!.id;

      // Create a sale item asset
      const { data: saleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: saleItemId,
          asset_id: testAssetId,
        })
        .select()
        .single();

      saleItemAssetId = saleItemAsset!.id;
    });

    it('should create royalty transactions for fixed royalties', async () => {
      const transactions = await createRoyaltyTransactionsForSaleItemAsset({
        saleId: testSaleId,
        saleItemId,
        saleItemAssetId,
        assetId: testAssetId,
        saleItemPriceCents: 2000,
        currency: 'usd',
      });

      expect(transactions).toBeDefined();
      expect(transactions.length).toBeGreaterThanOrEqual(2);

      // Verify transaction for user 1 (500 cents)
      const user1Transaction = transactions.find(t => t.recipient_user_id === testUser1Id);
      expect(user1Transaction).toBeDefined();
      expect(user1Transaction?.calculated_cents).toBe(500);
      expect(user1Transaction?.status).toBe('ready_to_pay');

      // Verify transaction for user 2 (300 cents)
      const user2Transaction = transactions.find(t => t.recipient_user_id === testUser2Id);
      expect(user2Transaction).toBeDefined();
      expect(user2Transaction?.calculated_cents).toBe(300);
    });

    it('should handle percentage royalties', async () => {
      // Create an asset with percentage royalty
      const { data: percentAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'percent-asset',
          title: 'Percentage Asset',
          status: 'published',
        })
        .select()
        .single();

      // Create percentage royalty (20%)
      await supabase
        .from('asset_royalties')
        .insert({
          asset_id: percentAsset!.id,
          user_id: testUser1Id,
          royalty_type: 'percentage',
          royalty_value: 20, // 20%
        });

      // Create sale item asset
      const { data: newSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          total_cents: 1000,
          status: 'completed',
        })
        .select()
        .single();

      const { data: newSaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: newSale!.id,
          variant_id: testVariantId,
          quantity: 1,
          unit_price_cents: 1000,
          snapshot: {},
        })
        .select()
        .single();

      const { data: newSaleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: newSaleItem!.id,
          asset_id: percentAsset!.id,
        })
        .select()
        .single();

      const transactions = await createRoyaltyTransactionsForSaleItemAsset({
        saleId: newSale!.id,
        saleItemId: newSaleItem!.id,
        saleItemAssetId: newSaleItemAsset!.id,
        assetId: percentAsset!.id,
        saleItemPriceCents: 1000,
        currency: 'usd',
      });

      expect(transactions.length).toBe(1);
      expect(transactions[0].calculated_cents).toBe(200); // 20% of 1000
      expect(transactions[0].royalty_type).toBe('percentage');
    });

    it('should skip royalties with zero or negative calculated amounts', async () => {
      // Create asset with zero royalty
      const { data: zeroAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'zero-asset',
          title: 'Zero Asset',
          status: 'published',
        })
        .select()
        .single();

      await supabase
        .from('asset_royalties')
        .insert({
          asset_id: zeroAsset!.id,
          user_id: testUser1Id,
          royalty_type: 'fixed',
          royalty_value: 0,
        });

      const { data: zeroSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          total_cents: 100,
          status: 'completed',
        })
        .select()
        .single();

      const { data: zeroSaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: zeroSale!.id,
          variant_id: testVariantId,
          quantity: 1,
          unit_price_cents: 100,
          snapshot: {},
        })
        .select()
        .single();

      const { data: zeroSaleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: zeroSaleItem!.id,
          asset_id: zeroAsset!.id,
        })
        .select()
        .single();

      const transactions = await createRoyaltyTransactionsForSaleItemAsset({
        saleId: zeroSale!.id,
        saleItemId: zeroSaleItem!.id,
        saleItemAssetId: zeroSaleItemAsset!.id,
        assetId: zeroAsset!.id,
        saleItemPriceCents: 100,
        currency: 'usd',
      });

      expect(transactions).toEqual([]);
    });

    it('should return empty array if no royalties configured', async () => {
      // Create asset with no royalties
      const { data: emptyAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'empty-royalty-asset',
          title: 'Empty Royalty Asset',
          status: 'published',
        })
        .select()
        .single();

      const { data: emptySale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          total_cents: 100,
          status: 'completed',
        })
        .select()
        .single();

      const { data: emptySaleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: emptySale!.id,
          variant_id: testVariantId,
          quantity: 1,
          unit_price_cents: 100,
          snapshot: {},
        })
        .select()
        .single();

      const { data: emptySaleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: emptySaleItem!.id,
          asset_id: emptyAsset!.id,
        })
        .select()
        .single();

      const transactions = await createRoyaltyTransactionsForSaleItemAsset({
        saleId: emptySale!.id,
        saleItemId: emptySaleItem!.id,
        saleItemAssetId: emptySaleItemAsset!.id,
        assetId: emptyAsset!.id,
        saleItemPriceCents: 100,
        currency: 'usd',
      });

      expect(transactions).toEqual([]);
    });
  });

  describe('getUserRoyaltyTransactions', () => {
    it('should fetch all royalty transactions for a user', async () => {
      const transactions = await getUserRoyaltyTransactions(testUser1Id);

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.every(t => t.recipient_user_id === testUser1Id)).toBe(true);
    });

    it('should not include other users transactions', async () => {
      const user1Transactions = await getUserRoyaltyTransactions(testUser1Id);
      const user2Transactions = await getUserRoyaltyTransactions(testUser2Id);

      const hasOverlap = user1Transactions.some(t1 =>
        user2Transactions.some(t2 => t1.id === t2.id)
      );

      expect(hasOverlap).toBe(false);
    });

    it('should order transactions by created_at descending', async () => {
      const transactions = await getUserRoyaltyTransactions(testUser1Id);

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
      const summary = await getUserEarningsSummary(testUser1Id);

      expect(summary).toBeDefined();
      expect(summary.totalEarnings).toBeGreaterThanOrEqual(500);
      expect(summary.transactionCount).toBeGreaterThan(0);
    });

    it('should calculate month-based earnings', async () => {
      const summary = await getUserEarningsSummary(testUser1Id);

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
        .eq('sale_id', testSaleId);

      const allRefunded = transactions?.every(t => t.status === 'refunded');
      expect(allRefunded).toBe(true);
    });

    it('should not affect already paid royalties', async () => {
      // Create a new sale with paid royalty
      const { data: paidSale } = await supabase
        .from('sales')
        .insert({
          user_id: testUser1Id,
          total_cents: 1000,
          status: 'completed',
        })
        .select()
        .single();

      await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: paidSale!.id,
          recipient_user_id: testUser1Id,
          calculated_cents: 500,
          status: 'paid',
        });

      const refundedCount = await markSaleRoyaltiesAsRefunded(paidSale!.id);

      expect(refundedCount).toBe(0); // No ready_to_pay to refund
    });
  });
});
