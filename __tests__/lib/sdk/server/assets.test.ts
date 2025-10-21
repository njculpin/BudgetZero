/**
 * Asset SDK Tests
 * Tests for creating and updating assets
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createAsset,
  createAssetLicense,
  createAssetRoyalty,
  createAssetTag,
  getAssetById,
  getAssetLicenses,
  getAssetRoyalties,
  getAssetTags,
  listAssets,
  softDeleteAsset,
  updateAsset,
} from "@/lib/sdk/server/assets";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

describe("Asset SDK", () => {
  let supabase: Awaited<ReturnType<typeof createServiceClient>>;
  let testUserId: string;
  let createdAssetId: string;

  beforeAll(async () => {
    supabase = createServiceClient();

    // Create a test user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email: "asset-test@example.com",
        username: "assettest",
      })
      .select("id")
      .single();

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }

    testUserId = userData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (createdAssetId) {
      await supabase.from("assets").delete().eq("id", createdAssetId);
    }

    if (testUserId) {
      await supabase.from("users").delete().eq("id", testUserId);
    }
  });

  describe("createAsset", () => {
    it("should create a new asset successfully", async () => {
      const result = await createAsset(supabase, {
        user_id: testUserId,
        title: "Test Asset",
        description: "A test asset for unit testing",
        is_public: true,
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Test Asset");
      expect(result.data?.user_id).toBe(testUserId);
      expect(result.data?.is_public).toBe(true);

      if (result.data) {
        createdAssetId = result.data.id;
      }
    });

    it("should create a private asset", async () => {
      const result = await createAsset(supabase, {
        user_id: testUserId,
        title: "Private Test Asset",
        description: "A private test asset",
        is_public: false,
      });

      expect(!result.error).toBe(true);
      expect(result.data?.is_public).toBe(false);

      // Clean up
      if (result.data) {
        await supabase.from("assets").delete().eq("id", result.data.id);
      }
    });

    it("should fail without required fields", async () => {
      const result = await createAsset(supabase, {
        user_id: testUserId,
        title: "", // Empty title should fail
        is_public: true,
      });

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getAssetById", () => {
    it("should retrieve an asset by ID", async () => {
      const result = await getAssetById(supabase, createdAssetId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(createdAssetId);
      expect(result.data?.title).toBe("Test Asset");
    });

    it("should return error for non-existent asset", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const result = await getAssetById(supabase, fakeId);

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateAsset", () => {
    it("should update asset title and description", async () => {
      const result = await updateAsset(supabase, createdAssetId, {
        title: "Updated Test Asset",
        description: "Updated description",
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getAssetById(supabase, createdAssetId);
      expect(getResult.data?.title).toBe("Updated Test Asset");
      expect(getResult.data?.description).toBe("Updated description");
    });

    it("should update asset visibility", async () => {
      const result = await updateAsset(supabase, createdAssetId, {
        is_public: false,
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getAssetById(supabase, createdAssetId);
      expect(getResult.data?.is_public).toBe(false);
    });

    it("should fail to update non-existent asset", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const result = await updateAsset(supabase, fakeId, {
        title: "Should Fail",
      });

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("listAssets", () => {
    it("should list assets with pagination", async () => {
      const result = await listAssets(supabase, {
        limit: 10,
        offset: 0,
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should filter assets by user", async () => {
      const result = await listAssets(supabase, {
        userId: testUserId,
      });

      expect(!result.error).toBe(true);
      expect(result.data?.every((asset) => asset.user_id === testUserId)).toBe(
        true,
      );
    });
  });

  describe("Asset Tags", () => {
    let tagId: number;

    it("should create an asset tag", async () => {
      const result = await createAssetTag(supabase, {
        asset_id: createdAssetId,
        namespace: "category",
        value: "3d-models",
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        tagId = result.data.id;
      }
    });

    it("should retrieve asset tags", async () => {
      const result = await getAssetTags(supabase, createdAssetId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.[0].namespace).toBe("category");
      expect(result.data?.[0].value).toBe("3d-models");
    });
  });

  describe("Asset Royalties", () => {
    let royaltyId: number;

    it("should create an asset royalty", async () => {
      const result = await createAssetRoyalty(supabase, {
        asset_id: createdAssetId,
        user_id: testUserId,
        royalty_type: "percentage",
        royalty_value: 25,
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.royalty_type).toBe("percentage");
      expect(result.data?.royalty_value).toBe(25);

      if (result.data) {
        royaltyId = result.data.id;
      }
    });

    it("should retrieve asset royalties", async () => {
      const result = await getAssetRoyalties(supabase, createdAssetId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.[0].royalty_type).toBe("percentage");
    });

    it("should validate royalty percentage range", async () => {
      const result = await createAssetRoyalty(supabase, {
        asset_id: createdAssetId,
        user_id: testUserId,
        royalty_type: "percentage",
        royalty_value: 150, // Invalid: > 100
      });

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Asset Licenses", () => {
    let licenseId: number;
    let assetLicenseId: number;

    beforeAll(async () => {
      // Create a test license
      const { data, error } = await supabase
        .from("licenses")
        .insert({
          title: "Test License",
          description: "A test license",
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Failed to create test license: ${error.message}`);
      }

      licenseId = data.id;
    });

    afterAll(async () => {
      if (licenseId) {
        await supabase.from("licenses").delete().eq("id", licenseId);
      }
    });

    it("should create an asset license", async () => {
      const result = await createAssetLicense(supabase, {
        asset_id: createdAssetId,
        license_id: licenseId,
        is_active: true,
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.license_id).toBe(licenseId);
      expect(result.data?.is_active).toBe(true);

      if (result.data) {
        assetLicenseId = result.data.id;
      }
    });

    it("should retrieve asset licenses", async () => {
      const result = await getAssetLicenses(supabase, createdAssetId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.[0].license_id).toBe(licenseId);
    });
  });

  describe("softDeleteAsset", () => {
    let assetToDelete: string;

    beforeEach(async () => {
      // Create an asset to delete
      const result = await createAsset(supabase, {
        user_id: testUserId,
        title: "Asset to Delete",
        is_public: true,
      });

      if (result.data) {
        assetToDelete = result.data.id;
      }
    });

    it("should soft delete an asset", async () => {
      const result = await softDeleteAsset(supabase, assetToDelete);

      expect(!result.error).toBe(true);

      // Verify soft delete
      const getResult = await supabase
        .from("assets")
        .select("is_deleted, deleted_at")
        .eq("id", assetToDelete)
        .single();

      expect(getResult.data?.is_deleted).toBe(true);
      expect(getResult.data?.deleted_at).not.toBeNull();

      // Clean up
      await supabase.from("assets").delete().eq("id", assetToDelete);
    });

    it("should not retrieve soft deleted assets in list", async () => {
      await softDeleteAsset(supabase, assetToDelete);

      const result = await listAssets(supabase, {
        userId: testUserId,
      });

      const deletedAsset = result.data?.find((a) => a.id === assetToDelete);
      expect(deletedAsset).toBeUndefined();

      // Clean up
      await supabase.from("assets").delete().eq("id", assetToDelete);
    });
  });
});
