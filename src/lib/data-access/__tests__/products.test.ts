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
  createVariant,
  getProductVariants,
  updateVariant,
  deleteVariant,
  linkAssetToVariant,
  getVariantAssets,
  unlinkAssetFromVariant,
  createProductTag,
  getProductTags,
  getVariantRoyaltyTotal,
  getProductContributors
} from '../products';
import type { Product, ProductVariant } from '@/types';

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
        status: 'published',
      });

      expect(product).toBeDefined();
      expect(product?.user_id).toBe(testUserId);
      expect(product?.title).toBe('Test Product for E2E');
      expect(product?.description).toBe('This is a test product');
      expect(product?.status).toBe('published');
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
        status: 'published',
      });

      const product2 = await createProduct(testUserId, {
        title: 'Unique Title Test',
        status: 'published',
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
        status: 'published',
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
        status: 'published',
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
    it('should only return published products', async () => {
      const products = await getAllProducts();

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);

      // Verify all returned products are published
      const allPublished = products.every(p => p.status === 'published');
      expect(allPublished).toBe(true);

      // Verify draft product is NOT included
      const hasDraft = products.some(p => p.id === draftProductId);
      expect(hasDraft).toBe(false);
    });

    it('should filter draft products even with search query', async () => {
      const products = await getAllProducts('Draft Product');

      const hasDraft = products.some(p => p.id === draftProductId);
      expect(hasDraft).toBe(false);
    });

    it('should not return products with status other than published', async () => {
      // Create products with various statuses
      const archivedProduct = await createProduct(testUserId, {
        title: 'Archived Product',
        status: 'archived' as 'published',
      });

      const products = await getAllProducts();

      const hasArchived = products.some(p => p.id === archivedProduct?.id);
      expect(hasArchived).toBe(false);
    });
  });

  describe('P0 SECURITY: getProductsByTag - Status Filtering', () => {
    beforeEach(async () => {
      // Add tags to test products
      await createProductTag(testProductId, 'security-test');
      await createProductTag(draftProductId, 'security-test');
    });

    it('should only return published products when filtering by tag', async () => {
      const products = await getProductsByTag('security-test');

      // Should include published product
      const hasPublished = products.some(p => p.id === testProductId);
      expect(hasPublished).toBe(true);

      // Should NOT include draft product
      const hasDraft = products.some(p => p.id === draftProductId);
      expect(hasDraft).toBe(false);
    });
  });

  describe('updateProduct', () => {
    it('should update product title and generate new handle', async () => {
      const updatedProduct = await updateProduct(testProductId, {
        title: 'Updated Test Product',
      });

      expect(updatedProduct).toBeDefined();
      expect(updatedProduct?.title).toBe('Updated Test Product');
      expect(updatedProduct?.handle).toBe('updated-test-product');
    });

    it('should update product description', async () => {
      const updatedProduct = await updateProduct(testProductId, {
        description: 'Updated description',
      });

      expect(updatedProduct?.description).toBe('Updated description');
    });

    it('should update product status', async () => {
      const updatedProduct = await updateProduct(testProductId, {
        status: 'draft',
      });

      expect(updatedProduct?.status).toBe('draft');

      // Restore to published for other tests
      await updateProduct(testProductId, { status: 'published' });
    });

    it('should handle handle collision when updating title', async () => {
      // Create a product with a specific handle
      const product1 = await createProduct(testUserId, {
        title: 'Collision Test 1',
        status: 'published',
      });

      const product2 = await createProduct(testUserId, {
        title: 'Different Title',
        status: 'published',
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
        status: 'published',
      });

      const product2 = await createProduct(testUserId, {
        title: 'Product B',
        status: 'published',
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
        status: 'published',
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

    it('should include both published and draft products for owner', async () => {
      const products = await getUserProducts(testUserId);

      const hasPublished = products.some(p => p.id === testProductId);
      const hasDraft = products.some(p => p.id === draftProductId);

      expect(hasPublished).toBe(true);
      expect(hasDraft).toBe(true);
    });

    it('should not include deleted products', async () => {
      const tempProduct = await createProduct(testUserId, {
        title: 'User Products Delete Test',
        status: 'published',
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

  describe('Product Variants', () => {
    let variantId: string;

    it('should create a product variant', async () => {
      const variant = await createVariant(testProductId, {
        title: 'PDF Version',
        description: 'Digital PDF download',
        sku: 'TEST-PDF-001',
      });

      expect(variant).toBeDefined();
      expect(variant?.product_id).toBe(testProductId);
      expect(variant?.title).toBe('PDF Version');
      expect(variant?.sku).toBe('TEST-PDF-001');

      if (variant) {
        variantId = variant.id;
      }
    });

    it('should generate SKU if not provided', async () => {
      const variant = await createVariant(testProductId, {
        title: 'Print Version',
        description: 'Physical print',
      });

      expect(variant?.sku).toBeDefined();
      expect(variant?.sku).toContain('print-version');
    });

    it('should get variants for a product', async () => {
      const variants = await getProductVariants(testProductId);

      expect(variants).toBeDefined();
      expect(variants.length).toBeGreaterThan(0);
      expect(variants.some(v => v.id === variantId)).toBe(true);
    });

    it('should update a variant', async () => {
      const updatedVariant = await updateVariant(variantId, {
        title: 'PDF Version Updated',
        description: 'Updated description',
      });

      expect(updatedVariant?.title).toBe('PDF Version Updated');
      expect(updatedVariant?.description).toBe('Updated description');
    });

    it('should not return deleted variants', async () => {
      const tempVariant = await createVariant(testProductId, {
        title: 'To Delete',
      });

      await deleteVariant(tempVariant!.id);

      const variants = await getProductVariants(testProductId);
      const hasDeleted = variants.some(v => v.id === tempVariant!.id);

      expect(hasDeleted).toBe(false);
    });

    it('should soft delete a variant', async () => {
      const tempVariant = await createVariant(testProductId, {
        title: 'Soft Delete Test',
      });

      const result = await deleteVariant(tempVariant!.id);
      expect(result).toBe(true);

      // Verify it still exists but marked deleted
      const { data } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', tempVariant!.id)
        .single();

      expect(data?.deleted).toBe(true);
      expect(data?.deleted_at).toBeDefined();
    });
  });

  describe('Product Tags', () => {
    it('should create a product tag', async () => {
      const result = await createProductTag(testProductId, 'Board Game');

      expect(result).toBe(true);

      const tags = await getProductTags(testProductId);
      expect(tags.some(t => t.value === 'board game')).toBe(true); // Normalized to lowercase
    });

    it('should normalize tags to lowercase', async () => {
      await createProductTag(testProductId, 'RPG');

      const tags = await getProductTags(testProductId);
      expect(tags.some(t => t.value === 'rpg')).toBe(true);
    });

    it('should handle duplicate tags gracefully', async () => {
      const result1 = await createProductTag(testProductId, 'tabletop');
      const result2 = await createProductTag(testProductId, 'tabletop');

      expect(result1).toBe(true);
      expect(result2).toBe(true); // Should not throw error

      const tags = await getProductTags(testProductId);
      const tabletopTags = tags.filter(t => t.value === 'tabletop');
      expect(tabletopTags.length).toBe(1); // Only one tag
    });
  });

  describe('P0 SECURITY: Asset Status Validation on Product Publish (4-State System)', () => {
    let assetValidationProductId: string;
    let assetValidationVariantId: string;
    let privateAssetId: string;
    let publicAssetId: string;
    let draftAssetId: string;
    let archivedAssetId: string;

    beforeEach(async () => {
      // Create test product
      const product = await createProduct(testUserId, {
        title: 'Asset Status Validation Test Product',
        status: 'draft',
      });
      if (!product) throw new Error('Failed to create test product');
      assetValidationProductId = product.id;

      // Create test variant
      const variant = await createVariant(assetValidationProductId, {
        title: 'Test Variant',
        sku: `ASSET-VALIDATION-${Date.now()}`,
      });
      if (!variant) throw new Error('Failed to create test variant');
      assetValidationVariantId = variant.id;

      // Create private asset
      const { data: privateAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUserId,
          handle: `private-asset-${Date.now()}`,
          title: 'Private Asset',
          status: 'private',
        })
        .select()
        .single();
      if (!privateAsset) throw new Error('Failed to create private asset');
      privateAssetId = privateAsset.id;

      // Create public asset
      const { data: publicAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUserId,
          handle: `public-asset-${Date.now()}`,
          title: 'Public Asset',
          status: 'public',
        })
        .select()
        .single();
      if (!publicAsset) throw new Error('Failed to create public asset');
      publicAssetId = publicAsset.id;

      // Create draft asset
      const { data: draftAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUserId,
          handle: `draft-asset-${Date.now()}`,
          title: 'Draft Asset',
          status: 'draft',
        })
        .select()
        .single();
      if (!draftAsset) throw new Error('Failed to create draft asset');
      draftAssetId = draftAsset.id;

      // Create archived asset
      const { data: archivedAsset } = await supabase
        .from('assets')
        .insert({
          user_id: testUserId,
          handle: `archived-asset-${Date.now()}`,
          title: 'Archived Asset',
          status: 'archived',
        })
        .select()
        .single();
      if (!archivedAsset) throw new Error('Failed to create archived asset');
      archivedAssetId = archivedAsset.id;
    });

    it('should allow publishing product with private assets', async () => {
      // Link private asset to variant
      await linkAssetToVariant(assetValidationVariantId, privateAssetId);

      // Should succeed
      const updatedProduct = await updateProduct(assetValidationProductId, {
        status: 'published',
      });

      expect(updatedProduct?.status).toBe('published');
    });

    it('should allow publishing product with public assets', async () => {
      // Link public asset to variant
      await linkAssetToVariant(assetValidationVariantId, publicAssetId);

      // Should succeed
      const updatedProduct = await updateProduct(assetValidationProductId, {
        status: 'published',
      });

      expect(updatedProduct?.status).toBe('published');
    });

    it('should allow publishing product with mix of private and public assets', async () => {
      // Link both private and public assets
      await linkAssetToVariant(assetValidationVariantId, privateAssetId);
      await linkAssetToVariant(assetValidationVariantId, publicAssetId);

      // Should succeed
      const updatedProduct = await updateProduct(assetValidationProductId, {
        status: 'published',
      });

      expect(updatedProduct?.status).toBe('published');
    });

    it('should prevent publishing product with draft assets', async () => {
      // Link draft asset to variant
      await linkAssetToVariant(assetValidationVariantId, draftAssetId);

      // Should throw error
      await expect(
        updateProduct(assetValidationProductId, { status: 'published' })
      ).rejects.toThrow(/Cannot publish product.*not ready/i);

      // Verify product remains draft
      const product = await getProductById(assetValidationProductId);
      expect(product?.status).toBe('draft');
    });

    it('should prevent publishing product with archived assets', async () => {
      // Link archived asset to variant
      await linkAssetToVariant(assetValidationVariantId, archivedAssetId);

      // Should throw error
      await expect(
        updateProduct(assetValidationProductId, { status: 'published' })
      ).rejects.toThrow(/Cannot publish product.*not ready/i);

      // Verify product remains draft
      const product = await getProductById(assetValidationProductId);
      expect(product?.status).toBe('draft');
    });

    it('should prevent publishing product with mix of private and draft assets', async () => {
      // Link both private and draft assets
      await linkAssetToVariant(assetValidationVariantId, privateAssetId);
      await linkAssetToVariant(assetValidationVariantId, draftAssetId);

      // Should throw error due to draft asset
      await expect(
        updateProduct(assetValidationProductId, { status: 'published' })
      ).rejects.toThrow(/Cannot publish product.*not ready/i);

      // Verify product remains draft
      const product = await getProductById(assetValidationProductId);
      expect(product?.status).toBe('draft');
    });

    it('should prevent publishing product with mix of public and archived assets', async () => {
      // Link both public and archived assets
      await linkAssetToVariant(assetValidationVariantId, publicAssetId);
      await linkAssetToVariant(assetValidationVariantId, archivedAssetId);

      // Should throw error due to archived asset
      await expect(
        updateProduct(assetValidationProductId, { status: 'published' })
      ).rejects.toThrow(/Cannot publish product.*not ready/i);

      // Verify product remains draft
      const product = await getProductById(assetValidationProductId);
      expect(product?.status).toBe('draft');
    });

    it('should allow product to remain published if asset status changes after publish', async () => {
      // Link private asset
      await linkAssetToVariant(assetValidationVariantId, privateAssetId);

      // Publish product
      await updateProduct(assetValidationProductId, { status: 'published' });

      // Change asset to draft (this is allowed - no trigger on asset updates)
      await supabase
        .from('assets')
        .update({ status: 'draft' })
        .eq('id', privateAssetId);

      // Product should still be published
      const product = await getProductById(assetValidationProductId);
      expect(product?.status).toBe('published');

      // But attempting to publish again should fail
      await updateProduct(assetValidationProductId, { status: 'draft' });
      await expect(
        updateProduct(assetValidationProductId, { status: 'published' })
      ).rejects.toThrow(/Cannot publish product.*not ready/i);
    });

    it('should allow updating other product fields when product contains draft assets', async () => {
      // Link draft asset
      await linkAssetToVariant(assetValidationVariantId, draftAssetId);

      // Updating title should work (not changing status)
      const updatedProduct = await updateProduct(assetValidationProductId, {
        title: 'Updated Title',
      });

      expect(updatedProduct?.title).toBe('Updated Title');
      expect(updatedProduct?.status).toBe('draft');
    });

    it('should validate across multiple variants in same product', async () => {
      // Create second variant
      const variant2 = await createVariant(assetValidationProductId, {
        title: 'Test Variant 2',
        sku: `ASSET-VALIDATION-2-${Date.now()}`,
      });
      if (!variant2) throw new Error('Failed to create second variant');

      // Link private asset to first variant
      await linkAssetToVariant(assetValidationVariantId, privateAssetId);

      // Link draft asset to second variant
      await linkAssetToVariant(variant2.id, draftAssetId);

      // Should fail due to draft asset in variant 2
      await expect(
        updateProduct(assetValidationProductId, { status: 'published' })
      ).rejects.toThrow(/Cannot publish product.*not ready/i);
    });

    it('should allow publishing product with no assets', async () => {
      // Don't link any assets

      // Should succeed (empty product is allowed)
      const updatedProduct = await updateProduct(assetValidationProductId, {
        status: 'published',
      });

      expect(updatedProduct?.status).toBe('published');
    });

    it('should ignore soft-deleted assets in validation', async () => {
      // Link draft asset
      await linkAssetToVariant(assetValidationVariantId, draftAssetId);

      // Soft delete the draft asset
      await supabase
        .from('assets')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', draftAssetId);

      // Should succeed because deleted assets are ignored
      const updatedProduct = await updateProduct(assetValidationProductId, {
        status: 'published',
      });

      expect(updatedProduct?.status).toBe('published');
    });

    it('should ignore soft-deleted variants in validation', async () => {
      // Link draft asset to variant
      await linkAssetToVariant(assetValidationVariantId, draftAssetId);

      // Soft delete the variant
      await supabase
        .from('product_variants')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', assetValidationVariantId);

      // Should succeed because deleted variants are ignored
      const updatedProduct = await updateProduct(assetValidationProductId, {
        status: 'published',
      });

      expect(updatedProduct?.status).toBe('published');
    });
  });
});
