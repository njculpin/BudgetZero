/**
 * Product SDK Tests
 * Tests for creating and updating products with variants, prices, and assets
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAsset } from "@/lib/sdk/server/assets";
import {
  createProduct,
  createProductPrice,
  createProductTags,
  createProductVariant,
  deleteProductTags,
  getProductById,
  getProductPrices,
  getProductVariants,
  listProducts,
  updateProduct,
  updateProductPrice,
  updateProductVariant,
} from "@/lib/sdk/server/products";
import { createServiceClient } from "@/lib/supabase/service";

describe("Product SDK", () => {
  let supabase: Awaited<ReturnType<typeof createServiceClient>>;
  let testUserId: string;
  let testTeamId: string;
  let testAssetId: string;
  let createdProductId: string;
  let createdVariantId: number;
  let createdPriceId: number;

  beforeAll(async () => {
    supabase = createServiceClient();

    // Create a test user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email: "product-test@example.com",
        username: "producttest",
      })
      .select("id")
      .single();

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }

    testUserId = userData.id;

    // Create a test team
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: "Test Product Team",
      })
      .select("id")
      .single();

    if (teamError) {
      throw new Error(`Failed to create test team: ${teamError.message}`);
    }

    testTeamId = teamData.id;

    // Add user to team
    await supabase.from("team_users").insert({
      team_id: testTeamId,
      user_id: testUserId,
    });

    // Create a test asset
    const assetResult = await createAsset(supabase, {
      user_id: testUserId,
      title: "Test Product Asset",
      is_public: true,
    });

    if (assetResult.data) {
      testAssetId = assetResult.data.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (createdProductId) {
      await supabase.from("products").delete().eq("id", createdProductId);
    }

    if (testAssetId) {
      await supabase.from("assets").delete().eq("id", testAssetId);
    }

    if (testTeamId) {
      await supabase.from("team_users").delete().eq("team_id", testTeamId);
      await supabase.from("teams").delete().eq("id", testTeamId);
    }

    if (testUserId) {
      await supabase.from("users").delete().eq("id", testUserId);
    }
  });

  describe("createProduct", () => {
    it("should create a new product successfully", async () => {
      const result = await createProduct(supabase, {
        title: "Test Tabletop Game",
        description: "A complete tabletop game product for testing",
        handle: "test-tabletop-game",
        status: "draft",
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Test Tabletop Game");
      expect(result.data?.handle).toBe("test-tabletop-game");
      expect(result.data?.status).toBe("draft");

      if (result.data) {
        createdProductId = result.data.id;

        // Link product to team
        await supabase.from("product_teams").insert({
          product_id: createdProductId,
          team_id: testTeamId,
        });
      }
    });

    it("should create a product with custom metadata", async () => {
      const result = await createProduct(supabase, {
        title: "Premium Game Set",
        handle: "premium-game-set",
        status: "draft",
        is_featured: true,
      });

      expect(!result.error).toBe(true);
      expect(result.data?.is_featured).toBe(true);

      // Clean up
      if (result.data) {
        await supabase.from("products").delete().eq("id", result.data.id);
      }
    });

    it("should fail with duplicate handle", async () => {
      const result = await createProduct(supabase, {
        title: "Duplicate Handle Product",
        handle: "test-tabletop-game", // Already used
        status: "draft",
      });

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail without required fields", async () => {
      const result = await createProduct(supabase, {
        title: "",
        handle: "empty-title",
        status: "draft",
      });

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getProductById", () => {
    it("should retrieve a product by ID", async () => {
      const result = await getProductById(supabase, createdProductId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(createdProductId);
      expect(result.data?.title).toBe("Test Tabletop Game");
    });

    it("should return error for non-existent product", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const result = await getProductById(supabase, fakeId);

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateProduct", () => {
    it("should update product title and description", async () => {
      const result = await updateProduct(supabase, createdProductId, {
        title: "Updated Tabletop Game",
        description: "Updated game description with new features",
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getProductById(supabase, createdProductId);
      expect(getResult.data?.title).toBe("Updated Tabletop Game");
      expect(getResult.data?.description).toBe(
        "Updated game description with new features",
      );
    });

    it("should update product status", async () => {
      const result = await updateProduct(supabase, createdProductId, {
        status: "published",
        published_at: new Date().toISOString(),
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getProductById(supabase, createdProductId);
      expect(getResult.data?.status).toBe("published");
      expect(getResult.data?.published_at).not.toBeNull();
    });

    it("should update product featured status", async () => {
      const result = await updateProduct(supabase, createdProductId, {
        is_featured: true,
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getProductById(supabase, createdProductId);
      expect(getResult.data?.is_featured).toBe(true);
    });
  });

  describe("Product Variants", () => {
    it("should create a product variant", async () => {
      const result = await createProductVariant(supabase, {
        product_id: createdProductId,
        title: "Standard Edition",
        sku: "TEST-GAME-STD",
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Standard Edition");
      expect(result.data?.sku).toBe("TEST-GAME-STD");

      if (result.data) {
        createdVariantId = result.data.id;
      }
    });

    it("should retrieve product variants", async () => {
      const result = await getProductVariants(supabase, createdProductId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.[0].title).toBe("Standard Edition");
    });

    it("should update a product variant", async () => {
      const result = await updateProductVariant(supabase, createdVariantId, {
        title: "Deluxe Edition",
        sku: "TEST-GAME-DLX",
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getProductVariants(supabase, createdProductId);
      const variant = getResult.data?.find((v) => v.id === createdVariantId);
      expect(variant?.title).toBe("Deluxe Edition");
      expect(variant?.sku).toBe("TEST-GAME-DLX");
    });

    it("should link assets to variant", async () => {
      const { error } = await supabase.from("product_variant_assets").insert({
        variant_id: createdVariantId,
        asset_id: testAssetId,
      });

      expect(error).toBeNull();

      // Verify the link
      const { data, error: fetchError } = await supabase
        .from("product_variant_assets")
        .select("*")
        .eq("variant_id", createdVariantId)
        .eq("asset_id", testAssetId)
        .single();

      expect(fetchError).toBeNull();
      expect(data).toBeDefined();
      expect(data?.variant_id).toBe(createdVariantId);
      expect(data?.asset_id).toBe(testAssetId);
    });
  });

  describe("Product Prices", () => {
    it("should create a product price", async () => {
      const result = await createProductPrice(supabase, {
        variant_id: createdVariantId,
        price_cents: 2999, // $29.99
        currency: "USD",
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.price_cents).toBe(2999);
      expect(result.data?.currency).toBe("USD");

      if (result.data) {
        createdPriceId = result.data.id;
      }
    });

    it("should retrieve product prices", async () => {
      const result = await getProductPrices(supabase, createdVariantId);

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.[0].price_cents).toBe(2999);
    });

    it("should update a product price", async () => {
      const result = await updateProductPrice(supabase, createdPriceId, {
        price_cents: 3499, // $34.99
      });

      expect(!result.error).toBe(true);

      // Verify the update
      const getResult = await getProductPrices(supabase, createdVariantId);
      const price = getResult.data?.find((p) => p.id === createdPriceId);
      expect(price?.price_cents).toBe(3499);
    });

    it("should validate price is non-negative", async () => {
      const result = await createProductPrice(supabase, {
        variant_id: createdVariantId,
        price_cents: -100, // Invalid
        currency: "USD",
      });

      expect(!result.error).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Product Tags", () => {
    it("should create product tags", async () => {
      const result = await createProductTags(supabase, [
        {
          product_id: createdProductId,
          namespace: "category",
          value: "tabletop-rpg",
        },
        {
          product_id: createdProductId,
          namespace: "theme",
          value: "fantasy",
        },
      ]);

      expect(!result.error).toBe(true);
    });

    it("should retrieve product tags", async () => {
      const { data, error } = await supabase
        .from("product_tags")
        .select("*")
        .eq("product_id", createdProductId)
        .eq("is_deleted", false);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThanOrEqual(2);

      const categories = data?.filter((t) => t.namespace === "category");
      expect(categories?.some((t) => t.value === "tabletop-rpg")).toBe(true);
    });

    it("should delete product tags", async () => {
      const result = await deleteProductTags(supabase, createdProductId);

      expect(!result.error).toBe(true);

      // Verify deletion
      const { data } = await supabase
        .from("product_tags")
        .select("*")
        .eq("product_id", createdProductId)
        .eq("is_deleted", false);

      expect(data?.length).toBe(0);
    });
  });

  describe("listProducts", () => {
    it("should list products with pagination", async () => {
      const result = await listProducts(supabase, {
        limit: 10,
        offset: 0,
      });

      expect(!result.error).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should filter products by status", async () => {
      const result = await listProducts(supabase, {
        status: "published",
      });

      expect(!result.error).toBe(true);
      expect(
        result.data?.every((product) => product.status === "published"),
      ).toBe(true);
    });
  });

  describe("Complete Product Workflow", () => {
    it("should create a complete product with variant, price, and assets", async () => {
      // 1. Create product
      const productResult = await createProduct(supabase, {
        title: "Complete Game Bundle",
        description: "A full game with multiple assets",
        handle: "complete-game-bundle",
        status: "draft",
      });

      expect(productResult.success).toBe(true);
      const productId = productResult.data?.id;

      // 2. Link to team
      await supabase.from("product_teams").insert({
        product_id: productId,
        team_id: testTeamId,
      });

      // 3. Create variant
      const variantResult = await createProductVariant(supabase, {
        product_id: productId!,
        title: "Full Bundle",
        sku: "COMPLETE-BUNDLE",
      });

      expect(variantResult.success).toBe(true);
      const variantId = variantResult.data?.id;

      // 4. Add price
      const priceResult = await createProductPrice(supabase, {
        variant_id: variantId!,
        price_cents: 4999,
        currency: "USD",
      });

      expect(priceResult.success).toBe(true);

      // 5. Link assets
      const { error: assetLinkError } = await supabase
        .from("product_variant_assets")
        .insert({
          variant_id: variantId!,
          asset_id: testAssetId,
        });

      expect(assetLinkError).toBeNull();

      // 6. Add tags
      const tagsResult = await createProductTags(supabase, [
        {
          product_id: productId!,
          namespace: "category",
          value: "complete-set",
        },
      ]);

      expect(tagsResult.success).toBe(true);

      // 7. Publish product
      const publishResult = await updateProduct(supabase, productId!, {
        status: "published",
        published_at: new Date().toISOString(),
      });

      expect(publishResult.success).toBe(true);

      // Verify complete setup
      const finalProduct = await getProductById(supabase, productId!);
      expect(finalProduct.data?.status).toBe("published");

      // Clean up
      await supabase.from("products").delete().eq("id", productId!);
    });
  });
});
