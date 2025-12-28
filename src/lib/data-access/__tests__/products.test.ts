import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  createProduct,
  getProductById,
  getProductByHandle,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getUserProducts,
  getProductsByTag,
  checkHandleAvailability,
  createProductTag,
  getProductTags,
  getProductContributors
} from '../products';
import type { Product } from '@/types';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Product Data Access Layer', () => {
  let testUserId: string;
  let testProductId: string;
  let testProductHandle: string;
  let draftProductId: string;
  let draftProductHandle: string;
  const testEmail = `test-products-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Clean up any orphaned test products from previous failed runs
    const testHandles = [
      'test-product-for-e2e',
      'draft-product-for-testing',
      'unique-title-test',
      'another-unique-title',
      'product-to-update',
      'product-to-delete',
      'product-with-tags',
      'test-public-product',
      'test-draft-product',
      'test-private-product',
      'test-archived-product',
      'to-be-deleted',
      'handle-deletion-test',
      'product-without-status',
      'collision-test-1',
      'different-title',
      'product-a',
      'product-b',
      'to-delete',
      'user-products-delete-test',
      'tag-test-product',
      'updated-test-product',
      'product-for-description-update',
      'product-for-status-update',
      'archived-product'
    ];

    for (const handle of testHandles) {
      // Delete all products with these base handles (including -1, -2, etc.)
      await supabase
        .from('products')
        .delete()
        .like('handle', `${handle}%`);
    }

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
  });

  afterAll(async () => {
    // Clean up test user and products
    if (testUserId) {
      // Products will be cascade deleted with user
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('createProduct', () => {
    it('should create a new product with generated handle', async () => {
      const product = await createProduct(testUserId, {
        title: 'Test Product for E2E',
        description: 'This is a test product',
        status: 'public',
      });

      expect(product).toBeDefined();
      expect(product?.user_id).toBe(testUserId);
      expect(product?.title).toBe('Test Product for E2E');
      expect(product?.description).toBe('This is a test product');
      expect(product?.status).toBe('public');
      expect(product?.handle).toBe('test-product-for-e2e');
      expect(product?.deleted).toBe(false);

      // Store for later tests
      if (product) {
        testProductId = product.id;
        testProductHandle = product.handle;
      }
    });

    it('should create a draft product', async () => {
      const product = await createProduct(testUserId, {
        title: 'Draft Product for Testing',
        description: 'This is a draft product',
        status: 'draft',
      });

      expect(product).toBeDefined();
      expect(product?.status).toBe('draft');
      expect(product?.handle).toBe('draft-product-for-testing');

      if (product) {
        draftProductId = product.id;
        draftProductHandle = product.handle;
      }
    });

    it('should handle duplicate handles by appending counter', async () => {
      const product1 = await createProduct(testUserId, {
        title: 'Unique Title Test',
        status: 'public',
      });

      const product2 = await createProduct(testUserId, {
        title: 'Unique Title Test',
        status: 'public',
      });

      expect(product1?.handle).toBe('unique-title-test');
      expect(product2?.handle).toBe('unique-title-test-1');
    });

    it('should default to draft status if not specified', async () => {
      const product = await createProduct(testUserId, {
        title: 'Product Without Status',
      });

      expect(product?.status).toBe('draft');
    });
  });

  describe('getProductById', () => {
    it('should fetch product by ID', async () => {
      const product = await getProductById(testProductId);

      expect(product).toBeDefined();
      expect(product?.id).toBe(testProductId);
      expect(product?.title).toBe('Test Product for E2E');
    });

    it('should return null for non-existent product ID', async () => {
      const product = await getProductById('00000000-0000-0000-0000-000000000000');
      expect(product).toBeNull();
    });

    it('should not return deleted products', async () => {
      const tempProduct = await createProduct(testUserId, {
        title: 'To Be Deleted',
        status: 'public',
      });

      expect(tempProduct).toBeDefined();

      // Soft delete
      await supabase
        .from('products')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', tempProduct!.id);

      const deletedProduct = await getProductById(tempProduct!.id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('getProductByHandle', () => {
    it('should fetch product by handle', async () => {
      const product = await getProductByHandle(testProductHandle);

      expect(product).toBeDefined();
      expect(product?.id).toBe(testProductId);
      expect(product?.handle).toBe(testProductHandle);
    });

    it('should return null for non-existent handle', async () => {
      const product = await getProductByHandle('nonexistent-handle-99999');
      expect(product).toBeNull();
    });

    it('should not return deleted products', async () => {
      const tempProduct = await createProduct(testUserId, {
        title: 'Handle Deletion Test',
        status: 'public',
      });

      const handle = tempProduct!.handle;

      await supabase
        .from('products')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', tempProduct!.id);

      const deletedProduct = await getProductByHandle(handle);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('P0 SECURITY: getAllProducts - Status Filtering', () => {
    it('should only return public products', async () => {
      const products = await getAllProducts();

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);

      // Verify all returned products are public
      const allpublic = products.every(p => p.status === 'public');
      expect(allpublic).toBe(true);

      // Verify draft product is NOT included
      const hasDraft = products.some(p => p.id === draftProductId);
      expect(hasDraft).toBe(false);
    });

    it('should filter draft products even with search query', async () => {
      const products = await getAllProducts('Draft Product');

      const hasDraft = products.some(p => p.id === draftProductId);
      expect(hasDraft).toBe(false);
    });

    it('should not return products with status other than public', async () => {
      // Create products with various statuses
      const archivedProduct = await createProduct(testUserId, {
        title: 'Archived Product',
        status: 'archived' as 'public',
      });

      const products = await getAllProducts();

      const hasArchived = products.some(p => p.id === archivedProduct?.id);
      expect(hasArchived).toBe(false);
    });
  });

  describe('P0 SECURITY: getProductsByTag - Status Filtering', () => {
    it('should only return public products when filtering by tag', async () => {
      // Create fresh products for this test to avoid pollution
      const publicProduct = await createProduct(testUserId, {
        title: 'Public Product with Tag',
        status: 'public',
      });

      const draftProduct = await createProduct(testUserId, {
        title: 'Draft Product with Tag',
        status: 'draft',
      });

      // Add tags to both products
      await createProductTag(publicProduct!.id, 'tag-filter-test');
      await createProductTag(draftProduct!.id, 'tag-filter-test');

      const products = await getProductsByTag('tag-filter-test');

      // Should include public product
      const hasPublic = products.some(p => p.id === publicProduct!.id);
      expect(hasPublic).toBe(true);

      // Should NOT include draft product
      const hasDraft = products.some(p => p.id === draftProduct!.id);
      expect(hasDraft).toBe(false);
    });
  });

  describe('updateProduct', () => {
    it('should update product title and generate new handle', async () => {
      // Create a separate product for this test to avoid polluting testProductId
      const tempProduct = await createProduct(testUserId, {
        title: 'Product to Update',
        status: 'public',
      });

      const updatedProduct = await updateProduct(tempProduct!.id, {
        title: 'Updated Test Product',
      });

      expect(updatedProduct).toBeDefined();
      expect(updatedProduct?.title).toBe('Updated Test Product');
      expect(updatedProduct?.handle).toBe('updated-test-product');
    });

    it('should update product description', async () => {
      // Create a separate product for this test
      const tempProduct = await createProduct(testUserId, {
        title: 'Product for Description Update',
        status: 'public',
      });

      const updatedProduct = await updateProduct(tempProduct!.id, {
        description: 'Updated description',
      });

      expect(updatedProduct?.description).toBe('Updated description');
    });

    it('should update product status', async () => {
      // Create a separate product for this test
      const tempProduct = await createProduct(testUserId, {
        title: 'Product for Status Update',
        status: 'public',
      });

      const updatedProduct = await updateProduct(tempProduct!.id, {
        status: 'draft',
      });

      expect(updatedProduct?.status).toBe('draft');
    });

    it('should handle handle collision when updating title', async () => {
      // Create a product with a specific handle
      const product1 = await createProduct(testUserId, {
        title: 'Collision Test 1',
        status: 'public',
      });

      const product2 = await createProduct(testUserId, {
        title: 'Different Title',
        status: 'public',
      });

      // Try to update product2 to have the same title as product1
      const updatedProduct = await updateProduct(product2!.id, {
        title: 'Collision Test 1',
      });

      // Should generate a unique handle
      expect(updatedProduct?.handle).not.toBe('collision-test-1');
      expect(updatedProduct?.handle).toMatch(/collision-test-1-\d+/);
    });

    it('should throw error if custom handle is taken', async () => {
      const product1 = await createProduct(testUserId, {
        title: 'Product A',
        status: 'public',
      });

      const product2 = await createProduct(testUserId, {
        title: 'Product B',
        status: 'public',
      });

      await expect(
        updateProduct(product2!.id, { handle: product1!.handle })
      ).rejects.toThrow('Handle is already taken');
    });

    it('should update tags', async () => {
      await updateProduct(testProductId, {
        tags: ['tag1', 'tag2', 'tag3'],
      });

      const tags = await getProductTags(testProductId);
      expect(tags.length).toBe(3);
      expect(tags.map(t => t.value)).toContain('tag1');
      expect(tags.map(t => t.value)).toContain('tag2');
      expect(tags.map(t => t.value)).toContain('tag3');
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      const tempProduct = await createProduct(testUserId, {
        title: 'To Delete',
        status: 'public',
      });

      const result = await deleteProduct(tempProduct!.id);
      expect(result).toBe(true);

      // Verify product is soft deleted
      const deletedProduct = await getProductById(tempProduct!.id);
      expect(deletedProduct).toBeNull();

      // Verify it still exists in database but marked deleted
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', tempProduct!.id)
        .single();

      expect(data?.deleted).toBe(true);
      expect(data?.deleted_at).toBeDefined();
    });
  });

  describe('getUserProducts', () => {
    it('should return all products for a user', async () => {
      const products = await getUserProducts(testUserId);

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify all products belong to the user
      const allOwnedByUser = products.every(p => p.user_id === testUserId);
      expect(allOwnedByUser).toBe(true);
    });

    it('should include both public and draft products for owner', async () => {
      const products = await getUserProducts(testUserId);

      const haspublic = products.some(p => p.id === testProductId);
      const hasDraft = products.some(p => p.id === draftProductId);

      expect(haspublic).toBe(true);
      expect(hasDraft).toBe(true);
    });

    it('should not include deleted products', async () => {
      const tempProduct = await createProduct(testUserId, {
        title: 'User Products Delete Test',
        status: 'public',
      });

      await deleteProduct(tempProduct!.id);

      const products = await getUserProducts(testUserId);
      const hasDeleted = products.some(p => p.id === tempProduct!.id);

      expect(hasDeleted).toBe(false);
    });
  });

  describe('checkHandleAvailability', () => {
    it('should return false for taken handle', async () => {
      const available = await checkHandleAvailability(testProductHandle);
      expect(available).toBe(false);
    });

    it('should return true for available handle', async () => {
      const available = await checkHandleAvailability('unique-handle-99999');
      expect(available).toBe(true);
    });

    it('should return true for current product own handle', async () => {
      const available = await checkHandleAvailability(testProductHandle, testProductId);
      expect(available).toBe(true);
    });
  });

  describe('Product Tags', () => {
    it('should create a product tag', async () => {
      // Create a fresh product for tag tests to avoid conflicts
      const tagTestProduct = await createProduct(testUserId, {
        title: 'Tag Test Product',
        status: 'public',
      });

      const result = await createProductTag(tagTestProduct!.id, 'Board Game');

      expect(result).toBe(true);

      const tags = await getProductTags(tagTestProduct!.id);
      expect(tags.some(t => t.value === 'board game')).toBe(true); // Normalized to lowercase
    });

    it('should normalize tags to lowercase', async () => {
      // Create a fresh product for tag tests
      const tagTestProduct2 = await createProduct(testUserId, {
        title: 'Tag Test Product 2',
        status: 'public',
      });

      await createProductTag(tagTestProduct2!.id, 'RPG');

      const tags = await getProductTags(tagTestProduct2!.id);
      expect(tags.some(t => t.value === 'rpg')).toBe(true);
    });

    it('should handle duplicate tags gracefully', async () => {
      // Create a fresh product for tag tests
      const tagTestProduct3 = await createProduct(testUserId, {
        title: 'Tag Test Product 3',
        status: 'public',
      });

      const result1 = await createProductTag(tagTestProduct3!.id, 'tabletop');
      const result2 = await createProductTag(tagTestProduct3!.id, 'tabletop');

      expect(result1).toBe(true);
      expect(result2).toBe(true); // Should not throw error

      const tags = await getProductTags(tagTestProduct3!.id);
      const tabletopTags = tags.filter(t => t.value === 'tabletop');
      expect(tabletopTags.length).toBe(1); // Only one tag
    });
  });
});
