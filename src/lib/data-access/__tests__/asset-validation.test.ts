import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { canChangeAssetStatus, getProductsUsingAsset } from '../asset-validation';
import { serverClient } from '../client';

/**
 * Asset Status Downgrade Validation Tests
 *
 * Tests that public assets cannot be changed to private/draft/archived
 * if they are used in products owned by other users.
 *
 * Critical Business Rule:
 * - Prevents breaking other users' products by removing asset availability
 */

describe('Asset Status Downgrade Validation', () => {
  const OWNER_ID = 'test-owner-' + Date.now();
  const OTHER_USER_ID = 'test-other-' + Date.now();

  let publicAssetId: string;
  let privateAssetId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    // Create test assets
    const { data: publicAsset } = await serverClient
      .from('assets')
      .insert({
        user_id: OWNER_ID,
        title: 'Test Public Asset',
        handle: 'test-public-' + Date.now(),
        status: 'public',
        deleted: false,
      })
      .select()
      .single();

    const { data: privateAsset } = await serverClient
      .from('assets')
      .insert({
        user_id: OWNER_ID,
        title: 'Test Private Asset',
        handle: 'test-private-' + Date.now(),
        status: 'private',
        deleted: false,
      })
      .select()
      .single();

    publicAssetId = publicAsset!.id;
    privateAssetId = privateAsset!.id;

    // Create a product owned by OTHER user that uses the public asset
    const { data: product } = await serverClient
      .from('products')
      .insert({
        user_id: OTHER_USER_ID,
        title: 'Test Product Using Public Asset',
        handle: 'test-product-' + Date.now(),
        status: 'draft',
        deleted: false,
      })
      .select()
      .single();

    productId = product!.id;

    // Create variant
    const { data: variant } = await serverClient
      .from('product_variants')
      .insert({
        product_id: productId,
        title: 'Default Variant',
        position: 0,
        deleted: false,
      })
      .select()
      .single();

    variantId = variant!.id;

    // Link public asset to variant
    await serverClient
      .from('product_assets')
      .insert({
        variant_id: variantId,
        asset_id: publicAssetId,
      });
  });

  afterAll(async () => {
    // Cleanup
    await serverClient.from('product_assets').delete().eq('variant_id', variantId);
    await serverClient.from('product_variants').delete().eq('id', variantId);
    await serverClient.from('products').delete().eq('id', productId);
    await serverClient.from('assets').delete().in('id', [publicAssetId, privateAssetId]);
  });

  describe('canChangeAssetStatus()', () => {
    it('should ALLOW public → public (no change)', async () => {
      const result = await canChangeAssetStatus(
        publicAssetId,
        'public',
        'public',
        OWNER_ID
      );

      expect(result.allowed).toBe(true);
    });

    it('should ALLOW draft → any status', async () => {
      const draftToPrivate = await canChangeAssetStatus(
        privateAssetId,
        'draft',
        'private',
        OWNER_ID
      );
      expect(draftToPrivate.allowed).toBe(true);

      const draftToPublic = await canChangeAssetStatus(
        privateAssetId,
        'draft',
        'public',
        OWNER_ID
      );
      expect(draftToPublic.allowed).toBe(true);
    });

    it('should ALLOW private → draft/archived (affects only owner)', async () => {
      const privateToDraft = await canChangeAssetStatus(
        privateAssetId,
        'private',
        'draft',
        OWNER_ID
      );
      expect(privateToDraft.allowed).toBe(true);

      const privateToArchived = await canChangeAssetStatus(
        privateAssetId,
        'private',
        'archived',
        OWNER_ID
      );
      expect(privateToArchived.allowed).toBe(true);
    });

    it('should ALLOW any status → public (makes more available)', async () => {
      const draftToPublic = await canChangeAssetStatus(
        privateAssetId,
        'draft',
        'public',
        OWNER_ID
      );
      expect(draftToPublic.allowed).toBe(true);

      const privateToPublic = await canChangeAssetStatus(
        privateAssetId,
        'private',
        'public',
        OWNER_ID
      );
      expect(privateToPublic.allowed).toBe(true);
    });

    it('should BLOCK public → private when used in other users products', async () => {
      const result = await canChangeAssetStatus(
        publicAssetId,
        'public',
        'private',
        OWNER_ID
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('other users');
      expect(result.affectedProducts).toBeDefined();
      expect(result.affectedProducts!.length).toBeGreaterThan(0);
    });

    it('should BLOCK public → draft when used in other users products', async () => {
      const result = await canChangeAssetStatus(
        publicAssetId,
        'public',
        'draft',
        OWNER_ID
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('other users');
    });

    it('should BLOCK public → archived when used in other users products', async () => {
      const result = await canChangeAssetStatus(
        publicAssetId,
        'public',
        'archived',
        OWNER_ID
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('other users');
    });

    it('should include affected product details in validation result', async () => {
      const result = await canChangeAssetStatus(
        publicAssetId,
        'public',
        'private',
        OWNER_ID
      );

      expect(result.affectedProducts).toBeDefined();
      expect(result.affectedProducts![0]).toHaveProperty('id');
      expect(result.affectedProducts![0]).toHaveProperty('title');
      expect(result.affectedProducts![0]).toHaveProperty('owner_id');
      expect(result.affectedProducts![0].owner_id).toBe(OTHER_USER_ID);
    });
  });

  describe('getProductsUsingAsset()', () => {
    it('should return list of products using an asset', async () => {
      const products = await getProductsUsingAsset(publicAssetId);

      expect(products.length).toBeGreaterThan(0);
      expect(products[0]).toHaveProperty('productId');
      expect(products[0]).toHaveProperty('productTitle');
      expect(products[0]).toHaveProperty('ownerId');
      expect(products[0]).toHaveProperty('variantId');
      expect(products[0]).toHaveProperty('variantTitle');
    });

    it('should return empty array for unused asset', async () => {
      const products = await getProductsUsingAsset(privateAssetId);
      expect(products).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should ALLOW public → private if only used in owners own products', async () => {
      // Create an asset used only in owner's products
      const { data: ownAsset } = await serverClient
        .from('assets')
        .insert({
          user_id: OWNER_ID,
          title: 'Owner Only Asset',
          handle: 'owner-only-' + Date.now(),
          status: 'public',
          deleted: false,
        })
        .select()
        .single();

      const { data: ownProduct } = await serverClient
        .from('products')
        .insert({
          user_id: OWNER_ID, // Same owner
          title: 'Owner Product',
          handle: 'owner-product-' + Date.now(),
          status: 'draft',
          deleted: false,
        })
        .select()
        .single();

      const { data: ownVariant } = await serverClient
        .from('product_variants')
        .insert({
          product_id: ownProduct!.id,
          title: 'Variant',
          position: 0,
          deleted: false,
        })
        .select()
        .single();

      await serverClient
        .from('product_assets')
        .insert({
          variant_id: ownVariant!.id,
          asset_id: ownAsset!.id,
        });

      // Should ALLOW downgrade since only owner uses it
      const result = await canChangeAssetStatus(
        ownAsset!.id,
        'public',
        'private',
        OWNER_ID
      );

      expect(result.allowed).toBe(true);

      // Cleanup
      await serverClient.from('product_assets').delete().eq('variant_id', ownVariant!.id);
      await serverClient.from('product_variants').delete().eq('id', ownVariant!.id);
      await serverClient.from('products').delete().eq('id', ownProduct!.id);
      await serverClient.from('assets').delete().eq('id', ownAsset!.id);
    });
  });
});
