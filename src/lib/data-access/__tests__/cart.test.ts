import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getOrCreateCart,
  getCartById,
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartItemCount
} from '../cart';
import { createProduct, createVariant } from '../products';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Cart Data Access Layer', () => {
  let testUserId: string;
  let testProductId: string;
  let testVariantId: string;
  let testCartId: string;
  let testCartItemId: string;
  const testEmail = `test-cart-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authData.user.id;

    // Create a test product and variant
    const product = await createProduct(testUserId, {
      title: 'Test Product for Cart',
      status: 'published',
    });

    if (!product) throw new Error('Failed to create test product');
    testProductId = product.id;

    const variant = await createVariant(testProductId, {
      title: 'Test Variant',
      sku: 'TEST-CART-001',
    });

    if (!variant) throw new Error('Failed to create test variant');
    testVariantId = variant.id;
  });

  afterAll(async () => {
    // Clean up test user (cascades to cart and products)
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('getOrCreateCart', () => {
    it('should create a new cart for a user', async () => {
      const cart = await getOrCreateCart(testUserId);

      expect(cart).toBeDefined();
      expect(cart?.user_id).toBe(testUserId);

      if (cart) {
        testCartId = cart.id;
      }
    });

    it('should return existing cart if already exists', async () => {
      const cart1 = await getOrCreateCart(testUserId);
      const cart2 = await getOrCreateCart(testUserId);

      expect(cart1?.id).toBe(cart2?.id);
    });
  });

  describe('getCartById', () => {
    it('should fetch cart by ID', async () => {
      const cart = await getCartById(testCartId);

      expect(cart).toBeDefined();
      expect(cart?.id).toBe(testCartId);
      expect(cart?.user_id).toBe(testUserId);
    });

    it('should return null for non-existent cart ID', async () => {
      const cart = await getCartById('00000000-0000-0000-0000-000000000000');
      expect(cart).toBeNull();
    });
  });

  describe('addToCart', () => {
    it('should add a new item to cart', async () => {
      const cartItem = await addToCart(
        testCartId,
        testProductId,
        testVariantId,
        2
      );

      expect(cartItem).toBeDefined();
      expect(cartItem?.cart_id).toBe(testCartId);
      expect(cartItem?.product_id).toBe(testProductId);
      expect(cartItem?.variant_id).toBe(testVariantId);
      expect(cartItem?.quantity).toBe(2);

      if (cartItem) {
        testCartItemId = cartItem.id;
      }
    });

    it('should increase quantity if item already exists in cart', async () => {
      // Add the same item again
      const cartItem = await addToCart(
        testCartId,
        testProductId,
        testVariantId,
        3
      );

      expect(cartItem).toBeDefined();
      expect(cartItem?.quantity).toBe(5); // 2 + 3 = 5
      expect(cartItem?.id).toBe(testCartItemId); // Same item, not new one
    });

    it('should handle adding multiple different variants', async () => {
      // Create another variant
      const variant2 = await createVariant(testProductId, {
        title: 'Second Variant',
        sku: 'TEST-CART-002',
      });

      const cartItem = await addToCart(
        testCartId,
        testProductId,
        variant2!.id,
        1
      );

      expect(cartItem).toBeDefined();
      expect(cartItem?.variant_id).toBe(variant2!.id);
      expect(cartItem?.quantity).toBe(1);

      // Verify we now have 2 items in cart
      const items = await getCartItems(testCartId);
      expect(items.length).toBe(2);
    });
  });

  describe('getCartItems', () => {
    it('should return all items in cart', async () => {
      const items = await getCartItems(testCartId);

      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items.every(item => item.cart_id === testCartId)).toBe(true);
    });

    it('should return empty array for cart with no items', async () => {
      // Create a new user with empty cart
      const { data: user2Data } = await supabase.auth.admin.createUser({
        email: `test-cart-2-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const emptyCart = await getOrCreateCart(user2Data!.user.id);
      const items = await getCartItems(emptyCart!.id);

      expect(items).toEqual([]);

      // Clean up
      await supabase.auth.admin.deleteUser(user2Data!.user.id);
    });

    it('should order items by created_at descending', async () => {
      const items = await getCartItems(testCartId);

      if (items.length > 1) {
        for (let i = 0; i < items.length - 1; i++) {
          const current = new Date(items[i].created_at).getTime();
          const next = new Date(items[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update item quantity', async () => {
      const result = await updateCartItemQuantity(testCartItemId, 10);
      expect(result).toBe(true);

      const items = await getCartItems(testCartId);
      const updatedItem = items.find(item => item.id === testCartItemId);
      expect(updatedItem?.quantity).toBe(10);
    });

    it('should remove item if quantity is zero', async () => {
      const itemsBefore = await getCartItems(testCartId);
      const itemCountBefore = itemsBefore.length;

      const result = await updateCartItemQuantity(testCartItemId, 0);
      expect(result).toBe(true);

      const itemsAfter = await getCartItems(testCartId);
      expect(itemsAfter.length).toBe(itemCountBefore - 1);
    });

    it('should remove item if quantity is negative', async () => {
      // Add a new item to test with
      const cartItem = await addToCart(
        testCartId,
        testProductId,
        testVariantId,
        1
      );

      const result = await updateCartItemQuantity(cartItem!.id, -1);
      expect(result).toBe(true);

      const items = await getCartItems(testCartId);
      const removedItem = items.find(item => item.id === cartItem!.id);
      expect(removedItem).toBeUndefined();
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from cart', async () => {
      // Add a new item to remove
      const cartItem = await addToCart(
        testCartId,
        testProductId,
        testVariantId,
        1
      );

      const itemsBefore = await getCartItems(testCartId);
      const itemCountBefore = itemsBefore.length;

      const result = await removeFromCart(cartItem!.id);
      expect(result).toBe(true);

      const itemsAfter = await getCartItems(testCartId);
      expect(itemsAfter.length).toBe(itemCountBefore - 1);

      const removedItem = itemsAfter.find(item => item.id === cartItem!.id);
      expect(removedItem).toBeUndefined();
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      // Add a few items first
      await addToCart(testCartId, testProductId, testVariantId, 1);

      const itemsBefore = await getCartItems(testCartId);
      expect(itemsBefore.length).toBeGreaterThan(0);

      const result = await clearCart(testCartId);
      expect(result).toBe(true);

      const itemsAfter = await getCartItems(testCartId);
      expect(itemsAfter).toEqual([]);
    });

    it('should succeed even if cart is already empty', async () => {
      const result = await clearCart(testCartId);
      expect(result).toBe(true);

      const items = await getCartItems(testCartId);
      expect(items).toEqual([]);
    });
  });

  describe('getCartItemCount', () => {
    beforeAll(async () => {
      // Clear cart and add some items
      await clearCart(testCartId);
      await addToCart(testCartId, testProductId, testVariantId, 1);
    });

    it('should return correct item count', async () => {
      const count = await getCartItemCount(testUserId);
      expect(count).toBe(1);
    });

    it('should return 0 for user with no cart', async () => {
      const { data: user3Data } = await supabase.auth.admin.createUser({
        email: `test-cart-3-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const count = await getCartItemCount(user3Data!.user.id);
      expect(count).toBe(0);

      // Clean up
      await supabase.auth.admin.deleteUser(user3Data!.user.id);
    });

    it('should update count when items are added/removed', async () => {
      const countBefore = await getCartItemCount(testUserId);

      // Create another variant to add
      const variant3 = await createVariant(testProductId, {
        title: 'Third Variant',
        sku: 'TEST-CART-003',
      });

      await addToCart(testCartId, testProductId, variant3!.id, 1);

      const countAfter = await getCartItemCount(testUserId);
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  describe('Integration: Complete Cart Flow', () => {
    it('should complete a full cart lifecycle', async () => {
      // 1. Create cart
      const cart = await getOrCreateCart(testUserId);
      expect(cart).toBeDefined();

      // 2. Clear any existing items
      await clearCart(cart!.id);

      // 3. Add items
      await addToCart(cart!.id, testProductId, testVariantId, 2);
      let items = await getCartItems(cart!.id);
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(2);

      // 4. Update quantity
      await updateCartItemQuantity(items[0].id, 5);
      items = await getCartItems(cart!.id);
      expect(items[0].quantity).toBe(5);

      // 5. Get cart count
      const count = await getCartItemCount(testUserId);
      expect(count).toBe(1);

      // 6. Remove item
      await removeFromCart(items[0].id);
      items = await getCartItems(cart!.id);
      expect(items.length).toBe(0);

      // 7. Verify empty cart
      const finalCount = await getCartItemCount(testUserId);
      expect(finalCount).toBe(0);
    });
  });
});
