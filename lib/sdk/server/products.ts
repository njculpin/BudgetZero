import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";
import type {
  ApiResponse,
  DbClient,
  PaginatedResponse,
  PaginationParams,
} from "../shared/types";
import { calculatePagination, failure, success } from "../shared/utils";

// Extended Product Queries (with joins for UI)
export async function listProductsWithDetails(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("is_deleted", false)
    .order("published_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  console.log(data, error, count)

  return { data, error, count };
}

// List all products (including drafts) - for user's product management page
export async function listMyProductsWithDetails(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  // Use service client to bypass RLS for user's own products
  // (authentication already verified by calling page via getMe())
  const supabase = createServiceClient();

  // First get products
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data: products, error, count } = await query;

  if (error || !products) {
    return { data: products, error, count };
  }

  // Manually fetch related data for each product
  const productsWithDetails = await Promise.all(
    products.map(async (product) => {
      const [images, variants] = await Promise.all([
        supabase
          .from("product_images")
          .select("*")
          .eq("product_id", product.id),
        supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id),
      ]);

      // Fetch prices for each variant
      const variantsWithPrices = await Promise.all(
        (variants.data || []).map(async (variant) => {
          const { data: prices } = await supabase
            .from("product_prices")
            .select("*")
            .eq("variant_id", variant.id);

          return {
            ...variant,
            product_variant_prices: prices || [],
          };
        }),
      );

      return {
        ...product,
        product_images: images.data || [],
        product_variants: variantsWithPrices,
      };
    }),
  );

  return { data: productsWithDetails, error, count };
}

export async function getProductByIdWithDetails(id: string) {
  // Use service client to allow viewing draft products
  // (authentication verified by calling page via getMe())
  const supabase = createServiceClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return { data: product, error };
  }

  // Manually fetch related data
  const [images, variants, ratings] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", id),
    supabase.from("product_variants").select("*").eq("product_id", id),
    supabase.from("product_ratings").select("*").eq("product_id", id),
  ]);

  // Fetch nested data for variants
  const variantsWithDetails = await Promise.all(
    (variants.data || []).map(async (variant) => {
      const [prices, variantImages, variantAssets] = await Promise.all([
        supabase
          .from("product_prices")
          .select("*")
          .eq("variant_id", variant.id),
        supabase
          .from("product_variant_images")
          .select("*")
          .eq("variant_id", variant.id),
        supabase
          .from("product_variant_assets")
          .select("*")
          .eq("variant_id", variant.id),
      ]);

      // Fetch assets for variant assets
      const assetsWithDetails = await Promise.all(
        (variantAssets.data || []).map(async (va) => {
          const { data: asset } = await supabase
            .from("assets")
            .select("*")
            .eq("id", va.asset_id)
            .single();

          return {
            ...va,
            assets: asset,
          };
        }),
      );

      return {
        ...variant,
        product_variant_prices: prices.data || [],
        product_variant_images: variantImages.data || [],
        product_variant_assets: assetsWithDetails,
      };
    }),
  );

  return {
    data: {
      ...product,
      product_images: images.data || [],
      product_variants: variantsWithDetails,
      product_ratings: ratings.data || [],
    },
    error,
  };
}

export async function getProductByHandleWithDetails(handle: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`*`)
    .eq("handle", handle)
    .single();

  return { data, error };
}

// Products CRUD
export async function createProduct(
  client: DbClient,
  data: TablesInsert<"products">,
): Promise<ApiResponse<Tables<"products">>> {
  try {
    const { data: product, error } = await client
      .from("products")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(product);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductById(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"products">>> {
  try {
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductByHandle(
  client: DbClient,
  handle: string,
): Promise<ApiResponse<Tables<"products">>> {
  try {
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("handle", handle)
      .eq("is_deleted", false)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function listProducts(
  client: DbClient,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<Tables<"products">>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

// retrieve products that contain assets for a user
export async function listProductsByUserId(
  userId: string,
  options?: {
    search?: string;
    limit?: number;
    offset?: number;
    includeDetails?: boolean;
  },
) {
  const supabase = await createClient();

  // Get products created by this user via product_teams
  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (
        *,
        product_variant_prices (*)
      ),
      product_teams!inner (
        teams!inner (
          team_users!inner (
            user_id
          )
        )
      )
    `,
      { count: "exact" },
    )
    .eq("product_teams.teams.team_users.user_id", userId)
    .eq("status", "published")
    .eq("is_deleted", false)
    .order("published_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  return { data, error, count };
}

// Get products that contain assets created by a specific user
export async function listProductsWithUserAssets(
  userId: string,
  options?: {
    search?: string;
    limit?: number;
    offset?: number;
  },
) {
  const supabase = await createClient();

  // Get products that have variants containing assets by this user
  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants!inner (
        *,
        product_variant_prices (*),
        product_variant_assets!inner (
          assets!inner (
            user_id
          )
        )
      )
    `,
      { count: "exact" },
    )
    .eq("product_variants.product_variant_assets.assets.user_id", userId)
    .eq("status", "published")
    .eq("is_deleted", false)
    .order("published_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  return { data, error, count };
}

export async function updateProduct(
  client: DbClient,
  id: string,
  data: TablesUpdate<"products">,
): Promise<ApiResponse<Tables<"products">>> {
  try {
    const { data: product, error } = await client
      .from("products")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(product);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteProduct(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"products">>> {
  try {
    const { data, error } = await client
      .from("products")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function hardDeleteProduct(
  client: DbClient,
  id: string,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client.from("products").delete().eq("id", id);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

// Product Teams CRUD
export async function addProductTeam(
  client: DbClient,
  data: TablesInsert<"product_teams">,
): Promise<ApiResponse<Tables<"product_teams">>> {
  try {
    const { data: productTeam, error } = await client
      .from("product_teams")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(productTeam);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductTeams(
  client: DbClient,
  productId: string,
): Promise<ApiResponse<Tables<"product_teams">[]>> {
  try {
    const { data, error } = await client
      .from("product_teams")
      .select("*")
      .eq("product_id", productId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function removeProductTeam(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"product_teams">>> {
  try {
    const { data, error } = await client
      .from("product_teams")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Product Variants CRUD
export async function createProductVariant(
  client: DbClient,
  data: TablesInsert<"product_variants">,
): Promise<ApiResponse<Tables<"product_variants">>> {
  try {
    const { data: variant, error } = await client
      .from("product_variants")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(variant);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductVariants(
  client: DbClient,
  productId: string,
): Promise<ApiResponse<Tables<"product_variants">[]>> {
  try {
    const { data, error } = await client
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProductVariant(
  client: DbClient,
  id: number,
  data: TablesUpdate<"product_variants">,
): Promise<ApiResponse<Tables<"product_variants">>> {
  try {
    const { data: variant, error } = await client
      .from("product_variants")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(variant);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteProductVariant(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"product_variants">>> {
  try {
    const { data, error } = await client
      .from("product_variants")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Product Variant Assets CRUD
export async function addProductVariantAsset(
  client: DbClient,
  data: TablesInsert<"product_variant_assets">,
): Promise<ApiResponse<Tables<"product_variant_assets">>> {
  try {
    const { data: link, error } = await client
      .from("product_variant_assets")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(link);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductVariantAssets(
  client: DbClient,
  variantId: number,
): Promise<ApiResponse<Tables<"product_variant_assets">[]>> {
  try {
    const { data, error } = await client
      .from("product_variant_assets")
      .select("*")
      .eq("variant_id", variantId);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function removeProductVariantAsset(
  client: DbClient,
  id: number,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client
      .from("product_variant_assets")
      .delete()
      .eq("id", id);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

// Product Variant Images CRUD
export async function createProductVariantImage(
  client: DbClient,
  data: TablesInsert<"product_variant_images">,
): Promise<ApiResponse<Tables<"product_variant_images">>> {
  try {
    const { data: image, error } = await client
      .from("product_variant_images")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(image);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductVariantImages(
  client: DbClient,
  variantId: number,
): Promise<ApiResponse<Tables<"product_variant_images">[]>> {
  try {
    const { data, error } = await client
      .from("product_variant_images")
      .select("*")
      .eq("variant_id", variantId)
      .eq("is_deleted", false)
      .order("position", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProductVariantImage(
  client: DbClient,
  id: number,
  data: TablesUpdate<"product_variant_images">,
): Promise<ApiResponse<Tables<"product_variant_images">>> {
  try {
    const { data: image, error } = await client
      .from("product_variant_images")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(image);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteProductVariantImage(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"product_variant_images">>> {
  try {
    const { data, error } = await client
      .from("product_variant_images")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Product Prices CRUD
export async function createProductPrice(
  client: DbClient,
  data: TablesInsert<"product_prices">,
): Promise<ApiResponse<Tables<"product_prices">>> {
  try {
    const { data: price, error } = await client
      .from("product_prices")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(price);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductPrices(
  client: DbClient,
  variantId: number,
): Promise<ApiResponse<Tables<"product_prices">[]>> {
  try {
    const { data, error } = await client
      .from("product_prices")
      .select("*")
      .eq("variant_id", variantId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProductPrice(
  client: DbClient,
  id: number,
  data: TablesUpdate<"product_prices">,
): Promise<ApiResponse<Tables<"product_prices">>> {
  try {
    const { data: price, error } = await client
      .from("product_prices")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(price);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteProductPrice(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"product_prices">>> {
  try {
    const { data, error } = await client
      .from("product_prices")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Product Ratings CRUD
export async function createProductRating(
  client: DbClient,
  data: TablesInsert<"product_ratings">,
): Promise<ApiResponse<Tables<"product_ratings">>> {
  try {
    const { data: rating, error } = await client
      .from("product_ratings")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(rating);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductRatings(
  client: DbClient,
  productId: string,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<Tables<"product_ratings">>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from("product_ratings")
      .select("*", { count: "exact" })
      .eq("product_id", productId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateProductRating(
  client: DbClient,
  id: number,
  data: TablesUpdate<"product_ratings">,
): Promise<ApiResponse<Tables<"product_ratings">>> {
  try {
    const { data: rating, error } = await client
      .from("product_ratings")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(rating);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteProductRating(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"product_ratings">>> {
  try {
    const { data, error } = await client
      .from("product_ratings")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Product Categories CRUD
export async function createProductCategory(
  client: DbClient,
  data: TablesInsert<"product_categories">,
): Promise<ApiResponse<Tables<"product_categories">>> {
  try {
    const { data: category, error } = await client
      .from("product_categories")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(category);
  } catch (error) {
    return failure(error);
  }
}

export async function listProductCategories(
  client: DbClient,
): Promise<ApiResponse<Tables<"product_categories">[]>> {
  try {
    const { data, error } = await client
      .from("product_categories")
      .select("*")
      .eq("is_deleted", false)
      .order("title", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProductCategory(
  client: DbClient,
  id: number,
  data: TablesUpdate<"product_categories">,
): Promise<ApiResponse<Tables<"product_categories">>> {
  try {
    const { data: category, error } = await client
      .from("product_categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(category);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteProductCategory(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"product_categories">>> {
  try {
    const { data, error } = await client
      .from("product_categories")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Product To Product Categories CRUD
export async function addProductToCategory(
  client: DbClient,
  data: TablesInsert<"product_to_product_categories">,
): Promise<ApiResponse<Tables<"product_to_product_categories">>> {
  try {
    const { data: link, error } = await client
      .from("product_to_product_categories")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(link);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductCategories(
  client: DbClient,
  productId: string,
): Promise<ApiResponse<Tables<"product_to_product_categories">[]>> {
  try {
    const { data, error } = await client
      .from("product_to_product_categories")
      .select("*")
      .eq("product_id", productId);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function removeProductFromCategory(
  client: DbClient,
  id: string,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client
      .from("product_to_product_categories")
      .delete()
      .eq("id", id);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

// Product Tags CRUD
export async function deleteProductTags(
  client: DbClient,
  productId: string,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client
      .from("product_tags")
      .delete()
      .eq("product_id", productId);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

export async function createProductTags(
  client: DbClient,
  tags: Array<{ product_id: string; namespace: string; value: string }>,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client.from("product_tags").insert(tags);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}
