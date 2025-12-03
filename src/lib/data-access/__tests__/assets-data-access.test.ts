import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAsset,
  getAssetById,
  updateAsset,
  getPublicAssets,
  getUserAssets,
  getAssetsByStatus,
  getAssetsByTag,
} from '../assets';
import { serverClient } from '../client';
import type { AssetStatus } from '@/types';

/**
 * Asset Data Access Layer Tests
 *
 * Tests core asset CRUD operations and filtering functions
 * for the 4-state status system.
 */

describe('Asset Data Access Functions - 4-State Status System', () => {
  // Test user ID - will be set in beforeAll after creating auth user
  let TEST_USER_ID: string;
  const testAssetIds: string[] = [];

  beforeAll(async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testHandle = `test-handle-${Date.now()}`;

    // Create auth user using admin API
    // Note: A trigger (handle_new_user) automatically creates the public.users record
    const { data: authUser, error: authError } = await serverClient.auth.admin.createUser({
      email: testEmail,
      password: 'test-password-123',
      email_confirm: true,
      user_metadata: { name: 'Test User' },
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    // Set TEST_USER_ID to the created auth user's ID
    TEST_USER_ID = authUser.user.id;

    // Create test assets with all 4 statuses
    const statuses: AssetStatus[] = ['draft', 'private', 'public', 'archived'];

    for (const status of statuses) {
      // Insert directly for test purposes
      const { data: asset } = await serverClient
        .from('assets')
        .insert({
          user_id: TEST_USER_ID,
          title: `Test ${status} Asset`,
          handle: `test-${status}-asset-${Date.now()}`,
          description: `Test asset with ${status} status`,
          status,
          deleted: false,
        })
        .select()
        .single();

      if (asset) {
        testAssetIds.push(asset.id);
      }
    }

    // Create asset with tag for tag filtering tests
    const { data: taggedAsset } = await serverClient
      .from('assets')
      .insert({
        user_id: TEST_USER_ID,
        title: 'Tagged Public Asset',
        handle: `tagged-asset-${Date.now()}`,
        description: 'Asset with tags for testing',
        status: 'public',
        deleted: false,
      })
      .select()
      .single();

    if (taggedAsset) {
      testAssetIds.push(taggedAsset.id);

      // Add tag
      await serverClient
        .from('asset_tags')
        .insert({
          asset_id: taggedAsset.id,
          value: 'test-tag',
          deleted: false,
        });
    }
  });

  afterAll(async () => {
    // Cleanup assets and tags
    await serverClient
      .from('asset_tags')
      .delete()
      .in('asset_id', testAssetIds);

    await serverClient
      .from('assets')
      .delete()
      .in('id', testAssetIds);

    // Cleanup auth user (cascade deletes public.users automatically)
    await serverClient.auth.admin.deleteUser(TEST_USER_ID);
  });

  describe('getPublicAssets()', () => {
    it('should return only assets with status=public', async () => {
      const assets = await getPublicAssets();

      // Should contain our public test asset
      const publicAssets = assets.filter(a => testAssetIds.includes(a.id));
      expect(publicAssets.length).toBeGreaterThan(0);

      // All returned assets should have public status
      publicAssets.forEach(asset => {
        expect(asset.status).toBe('public');
      });
    });

    it('should exclude draft assets', async () => {
      const assets = await getPublicAssets();

      const draftAssets = assets.filter(a => a.status === 'draft');
      expect(draftAssets.length).toBe(0);
    });

    it('should exclude private assets', async () => {
      const assets = await getPublicAssets();

      const privateAssets = assets.filter(a => a.status === 'private');
      expect(privateAssets.length).toBe(0);
    });

    it('should exclude archived assets', async () => {
      const assets = await getPublicAssets();

      const archivedAssets = assets.filter(a => a.status === 'archived');
      expect(archivedAssets.length).toBe(0);
    });

    it('should exclude soft-deleted public assets', async () => {
      // Create and soft-delete a public asset
      const { data: deletedAsset } = await serverClient
        .from('assets')
        .insert({
          user_id: TEST_USER_ID,
          title: 'Deleted Public Asset',
          handle: `deleted-public-${Date.now()}`,
          description: 'Should not appear in results',
          status: 'public',
          deleted: true,
        })
        .select()
        .single();

      if (deletedAsset) {

        const assets = await getPublicAssets();
        const found = assets.find(a => a.id === deletedAsset.id);

        expect(found).toBeUndefined();

        // Cleanup
        await serverClient
          .from('assets')
          .delete()
          .eq('id', deletedAsset.id);
      }
    });

    it('should support search filtering', async () => {
      const assets = await getPublicAssets('Tagged Public');

      // Should find our tagged asset
      const found = assets.some(a => testAssetIds.includes(a.id) && a.title.includes('Tagged'));
      expect(found).toBe(true);
    });

    it('should support pagination with limit and offset', async () => {
      const page1 = await getPublicAssets(undefined, 2, 0);
      const page2 = await getPublicAssets(undefined, 2, 2);

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);

      // Pages should not overlap
      const page1Ids = page1.map(a => a.id);
      const page2Ids = page2.map(a => a.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('getUserAssets()', () => {
    it('should return all user assets when no status filter provided', async () => {
      const assets = await getUserAssets(TEST_USER_ID);

      // Should return at least our 4 test assets (draft, private, public, archived)
      const ourAssets = assets.filter(a => testAssetIds.includes(a.id));
      expect(ourAssets.length).toBeGreaterThanOrEqual(4);
    });

    it('should filter by single status', async () => {
      const draftAssets = await getUserAssets(TEST_USER_ID, 'draft');

      draftAssets.forEach(asset => {
        expect(asset.status).toBe('draft');
        expect(asset.user_id).toBe(TEST_USER_ID);
      });
    });

    it('should filter by array of statuses', async () => {
      const publicAssets = await getUserAssets(TEST_USER_ID, ['private', 'public']);

      publicAssets.forEach(asset => {
        expect(['private', 'public']).toContain(asset.status);
        expect(asset.user_id).toBe(TEST_USER_ID);
      });
    });

    it('should exclude soft-deleted assets', async () => {
      const assets = await getUserAssets(TEST_USER_ID);

      const deletedAssets = assets.filter(a => a.deleted === true);
      expect(deletedAssets.length).toBe(0);
    });

    it('should return assets in order by created_at descending', async () => {
      const assets = await getUserAssets(TEST_USER_ID);

      if (assets.length > 1) {
        const firstDate = new Date(assets[0].created_at);
        const secondDate = new Date(assets[1].created_at);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('getAssetsByStatus()', () => {
    it('should return assets with specific status', async () => {
      const publicAssets = await getAssetsByStatus(TEST_USER_ID, 'public');

      publicAssets.forEach(asset => {
        expect(asset.status).toBe('public');
        expect(asset.user_id).toBe(TEST_USER_ID);
      });
    });

    it('should support array of statuses', async () => {
      const activeAssets = await getAssetsByStatus(TEST_USER_ID, ['private', 'public']);

      activeAssets.forEach(asset => {
        expect(['private', 'public']).toContain(asset.status);
      });
    });

    it('should work with draft status', async () => {
      const draftAssets = await getAssetsByStatus(TEST_USER_ID, 'draft');

      const ourDrafts = draftAssets.filter(a => testAssetIds.includes(a.id));
      expect(ourDrafts.length).toBeGreaterThan(0);
      ourDrafts.forEach(asset => {
        expect(asset.status).toBe('draft');
      });
    });

    it('should work with archived status', async () => {
      const archivedAssets = await getAssetsByStatus(TEST_USER_ID, 'archived');

      const ourArchived = archivedAssets.filter(a => testAssetIds.includes(a.id));
      expect(ourArchived.length).toBeGreaterThan(0);
      ourArchived.forEach(asset => {
        expect(asset.status).toBe('archived');
      });
    });
  });

  describe('getAssetsByTag()', () => {
    it('should return only public tagged assets', async () => {
      const assets = await getAssetsByTag('test-tag');

      // Should find our tagged public asset
      const found = assets.some(a => testAssetIds.includes(a.id));
      expect(found).toBe(true);

      // All results should have public status
      assets.forEach(asset => {
        expect(asset.status).toBe('public');
      });
    });

    it('should NOT return private assets even with matching tag', async () => {
      // Create private asset with tag
      const { data: privateTaggedAsset } = await serverClient
        .from('assets')
        .insert({
          user_id: TEST_USER_ID,
          title: 'Private Tagged Asset',
          handle: `private-tagged-${Date.now()}`,
          description: 'Private asset with tag',
          status: 'private',
          deleted: false,
        })
        .select()
        .single();

      if (privateTaggedAsset) {

        await serverClient
          .from('asset_tags')
          .insert({
            asset_id: privateTaggedAsset.id,
            value: 'test-tag',
            deleted: false,
          });

        const assets = await getAssetsByTag('test-tag');
        const foundPrivate = assets.find(a => a.id === privateTaggedAsset.id);

        expect(foundPrivate).toBeUndefined();

        // Cleanup
        await serverClient
          .from('asset_tags')
          .delete()
          .eq('asset_id', privateTaggedAsset.id);
        await serverClient
          .from('assets')
          .delete()
          .eq('id', privateTaggedAsset.id);
      }
    });

    it('should return empty array for non-existent tag', async () => {
      const assets = await getAssetsByTag('non-existent-tag-' + Date.now());
      expect(assets).toEqual([]);
    });
  });

  describe('createAsset()', () => {
    it('should create asset with draft status by default', async () => {
      const asset = await createAsset(TEST_USER_ID);

      expect(asset).toBeDefined();
      expect(asset?.status).toBe('draft');
      expect(asset?.user_id).toBe(TEST_USER_ID);
      expect(asset?.deleted).toBe(false);

      if (asset) {
        testAssetIds.push(asset.id);
      }
    });

    it('should create asset with generated handle and title', async () => {
      const asset = await createAsset(TEST_USER_ID);

      expect(asset).toBeDefined();
      expect(asset?.title).toBeDefined();
      expect(asset?.handle).toBeDefined();
      expect(asset?.title).toBe(asset?.handle); // Title equals handle by default

      if (asset) {
        testAssetIds.push(asset.id);
      }
    });
  });

  describe('updateAsset()', () => {
    it('should update asset title', async () => {
      const asset = await createAsset(TEST_USER_ID);

      if (asset) {
        testAssetIds.push(asset.id);

        const updated = await updateAsset(asset.id, {
          title: 'Updated Title',
        });

        expect(updated?.title).toBe('Updated Title');
      }
    });

    it('should update asset status', async () => {
      const asset = await createAsset(TEST_USER_ID);

      if (asset) {
        testAssetIds.push(asset.id);

        const updated = await updateAsset(asset.id, {
          status: 'private',
        });

        expect(updated?.status).toBe('private');
      }
    });

    it('should update updated_at timestamp', async () => {
      const asset = await createAsset(TEST_USER_ID);

      if (asset) {
        testAssetIds.push(asset.id);

        const originalTimestamp = asset.updated_at;

        // Wait a bit to ensure timestamp differs
        await new Promise(resolve => setTimeout(resolve, 100));

        const updated = await updateAsset(asset.id, {
          title: 'Updated for Timestamp',
        });

        expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(
          new Date(originalTimestamp).getTime()
        );
      }
    });
  });

  describe('getAssetById()', () => {
    it('should return asset by ID', async () => {
      const asset = await createAsset(TEST_USER_ID);

      if (asset) {
        testAssetIds.push(asset.id);

        const retrieved = await getAssetById(asset.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(asset.id);
        expect(retrieved?.title).toBe(asset.title);
      }
    });

    it('should return null for non-existent ID', async () => {
      const retrieved = await getAssetById('00000000-0000-0000-0000-000000000000');
      expect(retrieved).toBeNull();
    });

    it('should return null for soft-deleted asset', async () => {
      const asset = await createAsset(TEST_USER_ID);

      if (asset) {
        // Soft delete
        await serverClient
          .from('assets')
          .update({ deleted: true })
          .eq('id', asset.id);

        const retrieved = await getAssetById(asset.id);
        expect(retrieved).toBeNull();

        // Hard delete for cleanup
        await serverClient
          .from('assets')
          .delete()
          .eq('id', asset.id);
      }
    });
  });
});
