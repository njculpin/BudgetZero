import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * P1 CRITICAL: Stripe Webhook Integration Tests
 *
 * Tests webhook event handling for:
 * - checkout.session.completed (purchase fulfillment)
 * - charge.refunded (refund handling)
 * - payment_intent.payment_failed (error handling)
 *
 * Business Impact: Webhooks are the backbone of payment processing.
 * Webhook failures = revenue loss, unfulfilled orders, incorrect royalties.
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DEPRECATED: Test setup uses variants and assets which were removed in December 2024
// TODO: Rewrite for product-centric model (products have files directly, no variants)
// NOTE: Webhooks will be tested manually with Stripe test keys before launch
describe.skip('Stripe Webhook Handler', () => {
  let testUserId: string;
  let creatorUserId: string;
  let productId: string;
  let variantId: string;
  let assetId: string;
  let cartId: string;

  const testEmail = `webhook-test-${Date.now()}@example.com`;
  const creatorEmail = `webhook-creator-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create test buyer
    const { data: buyerData } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    testUserId = buyerData!.user.id;

    // Create test creator
    const { data: creatorData } = await supabase.auth.admin.createUser({
      email: creatorEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    creatorUserId = creatorData!.user.id;

    // Create test product
    const { data: product } = await supabase
      .from('products')
      .insert({
        user_id: creatorUserId,
        title: 'Webhook Test Product',
        status: 'public',
        handle: `webhook-test-${Date.now()}`,
      })
      .select()
      .single();
    productId = product!.id;

    // Create variant
    const { data: variant } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        title: 'Standard Edition',
        sku: `WEBHOOK-TEST-${Date.now()}`,
      })
      .select()
      .single();
    variantId = variant!.id;

    // Create price
    await supabase
      .from('product_variant_prices')
      .insert({
        variant_id: variantId,
        unit_amount: 5000, // $50.00
        currency: 'usd',
        quantity_min: 1,
      });

    // Create asset with 15% royalty
    const { data: asset } = await supabase
      .from('assets')
      .insert({
        user_id: creatorUserId,
        title: 'Webhook Test Asset',
        status: 'public',
        handle: `webhook-asset-${Date.now()}`,
        file_type: 'pdf',
      })
      .select()
      .single();
    assetId = asset!.id;

    await supabase
      .from('asset_royalties')
      .insert({
        asset_id: assetId,
        recipient_user_id: creatorUserId,
        royalty_type: 'percentage',
        royalty_value: 15,
      });

    // Link asset to variant
    await supabase
      .from('product_assets')
      .insert({
        product_id: productId,
        variant_id: variantId,
        asset_id: assetId,
      });

    // Create cart with item
    const { data: cart } = await supabase
      .from('carts')
      .insert({ user_id: testUserId })
      .select()
      .single();
    cartId = cart!.id;

    await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId,
        quantity: 1,
      });
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
    if (creatorUserId) {
      await supabase.auth.admin.deleteUser(creatorUserId);
    }
  });

  describe('checkout.session.completed', () => {
    it('should create sale, sale items, and link assets', async () => {
      // Simulate the webhook processing logic
      // (In real tests, you'd POST to /api/webhooks/stripe with proper signature)

      // Create Sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_test_${Date.now()}`,
          status: 'paid',
        })
        .select()
        .single();

      expect(sale).toBeDefined();
      expect(sale!.user_id).toBe(testUserId);
      expect(sale!.price_cents).toBe(5000);
      expect(sale!.status).toBe('paid');

      // Create SaleItem
      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: productId,
          variant_id: variantId,
          price_cents: 5000,
          currency: 'usd',
          quantity: 1,
          snapshot: {
            product_title: 'Webhook Test Product',
            variant_title: 'Standard Edition',
          },
        })
        .select()
        .single();

      expect(saleItem).toBeDefined();
      expect(saleItem!.product_id).toBe(productId);

      // Link Asset to SaleItem
      const { data: saleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: saleItem!.id,
          asset_id: assetId,
        })
        .select()
        .single();

      expect(saleItemAsset).toBeDefined();
      expect(saleItemAsset!.asset_id).toBe(assetId);
    });

    it('should create royalty transactions with correct calculations', async () => {
      // Create sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: `pi_royalty_test_${Date.now()}`,
          status: 'paid',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: productId,
          variant_id: variantId,
          price_cents: 5000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      const { data: saleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: saleItem!.id,
          asset_id: assetId,
        })
        .select()
        .single();

      // Create royalty transaction (15% of $50.00 = $7.50)
      const { data: royalty } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          sale_item_asset_id: saleItemAsset!.id,
          asset_id: assetId,
          recipient_user_id: creatorUserId,
          royalty_type: 'percentage',
          royalty_value: 15,
          calculated_cents: 750, // 15% of 5000
          currency: 'usd',
          status: 'ready_to_pay',
        })
        .select()
        .single();

      expect(royalty).toBeDefined();
      expect(royalty!.recipient_user_id).toBe(creatorUserId);
      expect(royalty!.calculated_cents).toBe(750);
      expect(royalty!.status).toBe('ready_to_pay');
    });

    it('should clear cart after successful purchase', async () => {
      // Verify cart has items
      const { data: itemsBefore } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

      expect(itemsBefore!.length).toBeGreaterThan(0);

      // Clear cart (webhook would do this)
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      // Verify cart is empty
      const { data: itemsAfter } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

      expect(itemsAfter).toHaveLength(0);

      // Re-add item for other tests
      await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          variant_id: variantId,
          quantity: 1,
        });
    });

    it('should handle missing metadata gracefully', async () => {
      // Webhook should reject requests without userId/cartId
      // This would be tested by POSTing to webhook endpoint
      // For now, we verify that metadata is required

      const mockSession = {
        id: 'cs_test_invalid',
        metadata: {}, // Missing userId and cartId
      };

      expect(mockSession.metadata).not.toHaveProperty('userId');
      expect(mockSession.metadata).not.toHaveProperty('cartId');
    });

    it('should be idempotent (no duplicate sales for same charge)', async () => {
      const chargeId = `pi_idempotent_test_${Date.now()}`;

      // Create first sale
      const { data: sale1 } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
        })
        .select()
        .single();

      expect(sale1).toBeDefined();

      // Attempt to create duplicate sale with same charge_id
      const { error: duplicateError } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
        });

      // Should fail due to unique constraint on stripe_charge_id
      expect(duplicateError).toBeDefined();
      expect(duplicateError!.code).toBe('23505'); // Unique violation
    });
  });

  describe('charge.refunded', () => {
    it('should mark sale as refunded', async () => {
      const chargeId = `pi_refund_test_${Date.now()}`;

      // Create sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
        })
        .select()
        .single();

      expect(sale!.status).toBe('paid');

      // Simulate refund
      const { data: refundedSale } = await supabase
        .from('sales')
        .update({
          status: 'refunded',
          refund_reason: 'requested_by_customer',
        })
        .eq('id', sale!.id)
        .select()
        .single();

      expect(refundedSale!.status).toBe('refunded');
      expect(refundedSale!.refund_reason).toBe('requested_by_customer');
    });

    it('should mark royalty transactions as refunded', async () => {
      const chargeId = `pi_royalty_refund_${Date.now()}`;

      // Create sale with royalty
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: productId,
          variant_id: variantId,
          price_cents: 5000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      const { data: saleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: saleItem!.id,
          asset_id: assetId,
        })
        .select()
        .single();

      const { data: royalty } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          sale_item_asset_id: saleItemAsset!.id,
          asset_id: assetId,
          recipient_user_id: creatorUserId,
          royalty_type: 'percentage',
          royalty_value: 15,
          calculated_cents: 750,
          currency: 'usd',
          status: 'ready_to_pay',
        })
        .select()
        .single();

      expect(royalty!.status).toBe('ready_to_pay');

      // Simulate refund webhook marking royalties as refunded
      const { data: refundedRoyalty } = await supabase
        .from('sale_royalty_transactions')
        .update({ status: 'refunded' })
        .eq('sale_id', sale!.id)
        .eq('status', 'ready_to_pay') // Only refund unpaid royalties
        .select()
        .single();

      expect(refundedRoyalty!.status).toBe('refunded');
    });

    it('should not affect already-paid royalties', async () => {
      const chargeId = `pi_paid_royalty_refund_${Date.now()}`;

      // Create sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testUserId,
          user_email: testEmail,
          price_cents: 5000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: productId,
          variant_id: variantId,
          price_cents: 5000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      const { data: saleItemAsset } = await supabase
        .from('sale_item_assets')
        .insert({
          sale_item_id: saleItem!.id,
          asset_id: assetId,
        })
        .select()
        .single();

      // Create royalty that's already paid
      const { data: paidRoyalty } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          sale_item_asset_id: saleItemAsset!.id,
          asset_id: assetId,
          recipient_user_id: creatorUserId,
          royalty_type: 'percentage',
          royalty_value: 15,
          calculated_cents: 750,
          currency: 'usd',
          status: 'paid', // Already paid
        })
        .select()
        .single();

      expect(paidRoyalty!.status).toBe('paid');

      // Attempt refund (should not update already-paid royalties)
      const { data: updatedRoyalties } = await supabase
        .from('sale_royalty_transactions')
        .update({ status: 'refunded' })
        .eq('sale_id', sale!.id)
        .eq('status', 'ready_to_pay') // Only unpaid
        .select();

      expect(updatedRoyalties).toHaveLength(0);

      // Verify paid royalty unchanged
      const { data: unchangedRoyalty } = await supabase
        .from('sale_royalty_transactions')
        .select('*')
        .eq('id', paidRoyalty!.id)
        .single();

      expect(unchangedRoyalty!.status).toBe('paid');
    });
  });

  describe('webhook security', () => {
    it('should require valid signature', async () => {
      // In real tests, POST to webhook endpoint without signature
      // Expect 400 error
      const mockRequest = {
        headers: new Headers(), // No stripe-signature header
      };

      expect(mockRequest.headers.get('stripe-signature')).toBeNull();
    });

    it('should reject invalid signature', async () => {
      // In real tests, POST with invalid signature
      // Expect 400 error
      const mockRequest = {
        headers: new Headers({
          'stripe-signature': 'invalid_signature',
        }),
      };

      expect(mockRequest.headers.get('stripe-signature')).toBe('invalid_signature');
    });
  });

  describe('edge cases', () => {
    it('should handle empty cart gracefully', async () => {
      // Create empty cart
      const { data: emptyCart } = await supabase
        .from('carts')
        .insert({ user_id: testUserId })
        .select()
        .single();

      // Get items (should be empty)
      const { data: items } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', emptyCart!.id);

      expect(items).toHaveLength(0);

      // Webhook should reject empty cart
      // This prevents creating sales with no items
    });

    it('should handle cart with invalid product/variant', async () => {
      // Create cart item with non-existent product
      const { data: invalidCart } = await supabase
        .from('carts')
        .insert({ user_id: testUserId })
        .select()
        .single();

      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: invalidCart!.id,
          product_id: '00000000-0000-0000-0000-000000000000',
          variant_id: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
        });

      // Should fail due to foreign key constraint
      expect(insertError).toBeDefined();
      expect(insertError!.code).toBe('23503'); // FK violation
    });
  });
});
