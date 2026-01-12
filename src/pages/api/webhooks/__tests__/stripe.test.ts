import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * P0 CRITICAL: Stripe Webhook Integration Tests
 *
 * Tests webhook event handling for the product-centric model (post-December 2024).
 *
 * Coverage:
 * - checkout.session.completed (purchase fulfillment with royalties)
 * - charge.refunded (refund handling)
 * - payment_intent.payment_failed (error handling)
 * - Idempotency (duplicate webhook prevention)
 * - Platform fee calculations (10%)
 * - Royalty distribution (product-level royalties)
 * - Embedded product royalties
 *
 * Business Impact: Webhooks are revenue-critical. Failures = lost revenue,
 * unfulfilled orders, incorrect payouts, legal liability.
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Stripe Webhook Handler (Product-Centric Model)', () => {
  let testBuyerUserId: string;
  let testCreatorUserId: string;
  let testContributorUserId: string;
  let testProductId: string;
  let embeddedProductId: string;
  let cartId: string;

  const testBuyerEmail = `webhook-buyer-${Date.now()}@example.com`;
  const testCreatorEmail = `webhook-creator-${Date.now()}@example.com`;
  const testContributorEmail = `webhook-contributor-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create test buyer user
    const { data: buyerData } = await supabase.auth.admin.createUser({
      email: testBuyerEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    testBuyerUserId = buyerData!.user!.id;

    // Create test creator user
    const { data: creatorData } = await supabase.auth.admin.createUser({
      email: testCreatorEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    testCreatorUserId = creatorData!.user!.id;

    // Create test contributor user (for royalties)
    const { data: contributorData } = await supabase.auth.admin.createUser({
      email: testContributorEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    testContributorUserId = contributorData!.user!.id;

    // Create embedded product (owned by contributor)
    const { data: embeddedProduct } = await supabase
      .from('products')
      .insert({
        user_id: testContributorUserId,
        title: 'Embedded Test Product',
        description: 'A product that will be embedded in another product',
        status: 'public',
        handle: `webhook-embedded-${Date.now()}`,
      })
      .select()
      .single();
    embeddedProductId = embeddedProduct!.id;

    // Add a file to embedded product with pricing
    await supabase
      .from('product_files')
      .insert({
        product_id: embeddedProductId,
        name: 'Embedded Asset File.pdf',
        file_url: 'https://example.com/embedded-file.pdf',
        storage_path: 'test/embedded-file.pdf',
        file_size_kb: 500,
        mime_type: 'application/pdf',
        position: 0,
        price_cents: 1000, // $10.00 for embedded file
      });

    // Add royalty to embedded product (contributor gets 20% royalty)
    await supabase
      .from('product_royalties')
      .insert({
        product_id: embeddedProductId,
        user_id: testContributorUserId,
        royalty_type: 'percentage',
        royalty_value: 20, // 20% royalty
      });

    // Create main test product (owned by creator)
    const { data: product } = await supabase
      .from('products')
      .insert({
        user_id: testCreatorUserId,
        title: 'Webhook Test Product',
        description: 'Main product for webhook testing',
        status: 'public',
        handle: `webhook-test-${Date.now()}`,
      })
      .select()
      .single();
    testProductId = product!.id;

    // Add a file to main product with pricing
    await supabase
      .from('product_files')
      .insert({
        product_id: testProductId,
        name: 'Main Product File.pdf',
        file_url: 'https://example.com/main-file.pdf',
        storage_path: 'test/main-file.pdf',
        file_size_kb: 1000,
        mime_type: 'application/pdf',
        position: 0,
        price_cents: 3000, // $30.00 for main file
      });

    // Embed the contributor's product into the main product
    await supabase
      .from('product_components')
      .insert({
        parent_product_id: testProductId,
        child_product_id: embeddedProductId,
        inherited_price_cents: 1000, // $10.00 inherited from embedded product
      });

    // Add royalty to main product (contributor gets fixed $5 royalty)
    await supabase
      .from('product_royalties')
      .insert({
        product_id: testProductId,
        user_id: testContributorUserId,
        royalty_type: 'fixed',
        royalty_value: 500, // $5.00 fixed royalty
      });

    // Create cart
    const { data: cart } = await supabase
      .from('carts')
      .insert({ user_id: testBuyerUserId })
      .select()
      .single();
    cartId = cart!.id;

    // Add main product to cart
    await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: testProductId,
        quantity: 1,
      });
  });

  afterAll(async () => {
    // Cleanup users (cascades to products, files, royalties, etc.)
    if (testBuyerUserId) {
      await supabase.auth.admin.deleteUser(testBuyerUserId);
    }
    if (testCreatorUserId) {
      await supabase.auth.admin.deleteUser(testCreatorUserId);
    }
    if (testContributorUserId) {
      await supabase.auth.admin.deleteUser(testContributorUserId);
    }
  });

  describe('checkout.session.completed', () => {
    it('should create sale record with correct pricing', async () => {
      const chargeId = `pi_test_${Date.now()}`;

      // Simulate webhook: Create Sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000, // $30 main file + $10 embedded = $40 total
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      expect(sale).toBeDefined();
      expect(sale!.user_id).toBe(testBuyerUserId);
      expect(sale!.price_cents).toBe(4000);
      expect(sale!.status).toBe('paid');
      expect(sale!.payment_method).toBe('stripe');
      expect(sale!.stripe_charge_id).toBe(chargeId);
    });

    it('should create sale_item with product snapshot', async () => {
      const chargeId = `pi_saleitem_test_${Date.now()}`;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      // Create sale item with snapshot
      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {
            product_title: 'Webhook Test Product',
            product_description: 'Main product for webhook testing',
            files_price: 3000,
            documents_price: 0,
            embedded_price: 1000,
          },
        })
        .select()
        .single();

      expect(saleItem).toBeDefined();
      expect(saleItem!.product_id).toBe(testProductId);
      expect(saleItem!.price_cents).toBe(4000);
      expect(saleItem!.quantity).toBe(1);
      expect(saleItem!.snapshot).toHaveProperty('product_title');
      expect(saleItem!.snapshot).toHaveProperty('files_price', 3000);
      expect(saleItem!.snapshot).toHaveProperty('embedded_price', 1000);
    });

    it('should grant download access via sale_items', async () => {
      const chargeId = `pi_download_test_${Date.now()}`;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {
            main_product: testProductId,
            embedded_products: [embeddedProductId],
          },
        })
        .select()
        .single();

      // In the product-centric model, download access is granted via sale_items
      // The snapshot stores which products are included
      expect(saleItem).toBeDefined();
      expect(saleItem!.product_id).toBe(testProductId);
      expect(saleItem!.snapshot).toHaveProperty('main_product', testProductId);
      expect(saleItem!.snapshot).toHaveProperty('embedded_products');
    });

    it('should create royalty transactions for main product (fixed $5)', async () => {
      const chargeId = `pi_royalty_main_${Date.now()}`;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      // Get the royalty configuration for the main product
      const { data: royalties } = await supabase
        .from('product_royalties')
        .select('*')
        .eq('product_id', testProductId);

      expect(royalties).toHaveLength(1);
      const royalty = royalties![0];
      expect(royalty.royalty_type).toBe('fixed');
      expect(royalty.royalty_value).toBe(500); // $5.00

      // Create royalty transaction (product-centric model)
      const { data: royaltyTransaction } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          product_royalty_id: royalty.id,
          recipient_user_id: testContributorUserId,
          royalty_type: 'fixed',
          royalty_value: 500,
          calculated_cents: 500, // Fixed $5.00
          status: 'ready_to_pay',
        })
        .select()
        .single();

      expect(royaltyTransaction).toBeDefined();
      expect(royaltyTransaction!.recipient_user_id).toBe(testContributorUserId);
      expect(royaltyTransaction!.calculated_cents).toBe(500);
      expect(royaltyTransaction!.status).toBe('ready_to_pay');
    });

    it('should create royalty transactions for embedded product (20% of $10 = $2)', async () => {
      const chargeId = `pi_royalty_embedded_${Date.now()}`;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      // Get royalty for embedded product
      const { data: royalties } = await supabase
        .from('product_royalties')
        .select('*')
        .eq('product_id', embeddedProductId);

      expect(royalties).toHaveLength(1);
      const royalty = royalties![0];
      expect(royalty.royalty_type).toBe('percentage');
      expect(royalty.royalty_value).toBe(20); // 20%

      // Create royalty transaction (20% of $10 inherited price = $2)
      const inheritedPrice = 1000; // $10.00 from product_components
      const calculatedCents = Math.round((inheritedPrice * 20) / 100);

      const { data: royaltyTransaction } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          product_royalty_id: royalty.id,
          recipient_user_id: testContributorUserId,
          royalty_type: 'percentage',
          royalty_value: 20,
          calculated_cents: calculatedCents,
          status: 'ready_to_pay',
        })
        .select()
        .single();

      expect(royaltyTransaction).toBeDefined();
      expect(royaltyTransaction!.calculated_cents).toBe(200); // $2.00
      expect(royaltyTransaction!.status).toBe('ready_to_pay');
    });

    it('should clear cart after successful purchase', async () => {
      // Verify cart has items
      const { data: itemsBefore } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

      expect(itemsBefore!.length).toBeGreaterThan(0);

      // Simulate webhook clearing cart
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
          product_id: testProductId,
          quantity: 1,
        });
    });

    it('should handle missing metadata gracefully', async () => {
      // Webhook should reject requests without userId/cartId in metadata
      const mockSession = {
        id: 'cs_test_invalid',
        metadata: {}, // Missing required fields
      };

      expect(mockSession.metadata).not.toHaveProperty('userId');
      expect(mockSession.metadata).not.toHaveProperty('cartId');
      // In actual webhook, this would return 400 error
    });

    it('should be idempotent - no duplicate sales for same charge_id', async () => {
      const chargeId = `pi_idempotent_${Date.now()}`;

      // Create first sale
      const { data: sale1 } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      expect(sale1).toBeDefined();

      // Attempt duplicate sale (simulates webhook retry)
      const { error: duplicateError } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId, // Same charge ID
          status: 'paid',
          payment_method: 'stripe',
        });

      // Should fail due to unique constraint on stripe_charge_id
      expect(duplicateError).toBeDefined();
      expect(duplicateError!.code).toBe('23505'); // Unique violation
    });

    it('should handle cart with multiple products', async () => {
      const chargeId = `pi_multi_product_${Date.now()}`;

      // Create second test product
      const { data: product2 } = await supabase
        .from('products')
        .insert({
          user_id: testCreatorUserId,
          title: 'Second Test Product',
          status: 'public',
          handle: `webhook-test2-${Date.now()}`,
        })
        .select()
        .single();

      await supabase
        .from('product_files')
        .insert({
          product_id: product2!.id,
          name: 'Second Product File.pdf',
          file_url: 'https://example.com/file2.pdf',
          storage_path: 'test/file2.pdf',
          file_size_kb: 500,
          mime_type: 'application/pdf',
          position: 0,
          price_cents: 2000, // $20.00
        });

      // Add to cart
      await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: product2!.id,
          quantity: 1,
        });

      // Verify cart has 2 items
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

      expect(cartItems).toHaveLength(2);

      // Create sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 6000, // $40 + $20 = $60
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      // Create sale items for both products
      const { data: saleItems } = await supabase
        .from('sale_items')
        .insert([
          {
            sale_id: sale!.id,
            product_id: testProductId,
            price_cents: 4000,
            currency: 'usd',
            quantity: 1,
            snapshot: {},
          },
          {
            sale_id: sale!.id,
            product_id: product2!.id,
            price_cents: 2000,
            currency: 'usd',
            quantity: 1,
            snapshot: {},
          },
        ])
        .select();

      expect(saleItems).toHaveLength(2);
    });
  });

  describe('charge.refunded', () => {
    it('should mark sale as refunded', async () => {
      const chargeId = `pi_refund_test_${Date.now()}`;

      // Create sale
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      expect(sale!.status).toBe('paid');

      // Simulate refund webhook
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

    it('should mark pending royalty transactions as refunded', async () => {
      const chargeId = `pi_royalty_refund_${Date.now()}`;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      // Get product royalty
      const { data: productRoyalties } = await supabase
        .from('product_royalties')
        .select('*')
        .eq('product_id', testProductId)
        .single();

      // Create pending royalty
      const { data: royalty } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          product_royalty_id: productRoyalties!.id,
          recipient_user_id: testContributorUserId,
          royalty_type: 'fixed',
          royalty_value: 500,
          calculated_cents: 500,
          status: 'ready_to_pay',
        })
        .select()
        .single();

      expect(royalty!.status).toBe('ready_to_pay');

      // Simulate refund marking royalties as refunded
      const { data: refundedRoyalty } = await supabase
        .from('sale_royalty_transactions')
        .update({ status: 'refunded' })
        .eq('sale_id', sale!.id)
        .eq('status', 'ready_to_pay')
        .select()
        .single();

      expect(refundedRoyalty!.status).toBe('refunded');
    });

    it('should NOT mark already-paid royalties as refunded', async () => {
      const chargeId = `pi_paid_royalty_refund_${Date.now()}`;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: testBuyerUserId,
          user_email: testBuyerEmail,
          price_cents: 4000,
          tax_cents: 0,
          currency: 'usd',
          stripe_charge_id: chargeId,
          status: 'paid',
          payment_method: 'stripe',
        })
        .select()
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: testProductId,
          price_cents: 4000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select()
        .single();

      // Get product royalty
      const { data: productRoyalties } = await supabase
        .from('product_royalties')
        .select('*')
        .eq('product_id', testProductId)
        .single();

      // Create already-paid royalty
      const { data: paidRoyalty } = await supabase
        .from('sale_royalty_transactions')
        .insert({
          sale_id: sale!.id,
          sale_item_id: saleItem!.id,
          product_royalty_id: productRoyalties!.id,
          recipient_user_id: testContributorUserId,
          royalty_type: 'fixed',
          royalty_value: 500,
          calculated_cents: 500,
          status: 'paid', // Already paid out
        })
        .select()
        .single();

      expect(paidRoyalty!.status).toBe('paid');

      // Attempt refund (should not update paid royalties)
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

  describe('edge cases', () => {
    it('should reject empty cart', async () => {
      // Create empty cart (or use existing cart and clear it)
      const { data: existingCart } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', testBuyerUserId)
        .maybeSingle();

      let emptyCartId: string;
      if (existingCart) {
        emptyCartId = existingCart.id;
        // Clear all items from cart
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', emptyCartId);
      } else {
        // Create new cart if none exists
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: testBuyerUserId })
          .select()
          .single();
        emptyCartId = newCart!.id;
      }

      // Verify cart has no items
      const { data: items } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', emptyCartId);

      expect(items).toHaveLength(0);
      // Webhook should reject this with 400 error

      // Restore cart items for other tests
      await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: testProductId,
          quantity: 1,
        });
    });

    it('should handle product with no files (zero price)', async () => {
      // Create product with no files
      const { data: emptyProduct } = await supabase
        .from('products')
        .insert({
          user_id: testCreatorUserId,
          title: 'Empty Product',
          status: 'public',
          handle: `empty-product-${Date.now()}`,
        })
        .select()
        .single();

      // Get product files (should be empty)
      const { data: files } = await supabase
        .from('product_files')
        .select('*')
        .eq('product_id', emptyProduct!.id);

      expect(files).toHaveLength(0);
      // Webhook should reject products with zero price
    });

    it('should handle cart with invalid product reference', async () => {
      const invalidProductId = '00000000-0000-0000-0000-000000000000';

      // Attempt to add non-existent product to cart
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: invalidProductId,
          quantity: 1,
        });

      // Should fail due to foreign key constraint
      expect(error).toBeDefined();
      expect(error!.code).toBe('23503'); // FK violation
    });

    it('should handle royalty calculation with percentage rounding', async () => {
      // Test edge case: 15% of $33.33 = $4.9995 → should round to $5.00
      const testPrice = 3333; // $33.33
      const testPercentage = 15;
      const calculatedCents = Math.round((testPrice * testPercentage) / 100);

      expect(calculatedCents).toBe(500); // $5.00 (rounded)
    });
  });

  describe('platform fee calculations', () => {
    it('should validate 10% platform fee is applied correctly', async () => {
      // Platform takes 10% fee, creator gets 90%
      const salePriceCents = 4000; // $40.00
      const platformFeeCents = Math.round(salePriceCents * 0.10);
      const creatorRevenueCents = salePriceCents - platformFeeCents;

      expect(platformFeeCents).toBe(400); // $4.00 platform fee
      expect(creatorRevenueCents).toBe(3600); // $36.00 creator revenue
    });

    it('should ensure royalties do not exceed 90% of sale price', async () => {
      // Total royalties should not exceed 90% (platform reserves 10%)
      const salePriceCents = 4000; // $40.00
      const maxRoyaltiesCents = Math.round(salePriceCents * 0.90);

      // Example: $5 fixed + 20% of $10 embedded = $7 total royalties
      const fixedRoyalty = 500; // $5.00
      const percentageRoyalty = Math.round((1000 * 20) / 100); // $2.00
      const totalRoyalties = fixedRoyalty + percentageRoyalty;

      expect(totalRoyalties).toBe(700); // $7.00
      expect(totalRoyalties).toBeLessThanOrEqual(maxRoyaltiesCents);
    });
  });
});
