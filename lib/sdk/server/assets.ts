import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";
import type {
  ApiResponse,
  DbClient,
  PaginatedResponse,
  PaginationParams,
} from "../shared/types";
import { calculatePagination, failure, success } from "../shared/utils";

// Extended Asset Queries (with joins for UI)
export async function getAssetByIdWithDetails(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select(`
      *,
      creator:user_id(id, full_name, username),
      asset_tags(namespace, value),
      asset_images(*),
      asset_files(*),
      asset_royalties(*),
      asset_licenses(*)
    `)
    .eq("id", id)
    .single();

  return { data, error };
}

export async function listAssetsWithDetails(options?: {
  assetType?: string;
  search?: string;
  publicOnly?: boolean;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // Build query based on public/user filters
  let query = supabase
    .from("assets")
    .select(
      `
      *,
      creator:user_id(id, full_name, username),
      asset_images(id, image_url, position)
    `,
      { count: "exact" },
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  // Apply filters
  if (options?.publicOnly && !options?.userId) {
    // Public only - show only public assets
    query = query.eq("is_public", true);
  } else if (options?.userId && !options?.publicOnly) {
    // User only - show only user's assets
    query = query.eq("user_id", options.userId);
  } else if (options?.publicOnly && options?.userId) {
    // Both - show public assets OR user's assets
    query = query.or(`is_public.eq.true,user_id.eq.${options.userId}`);
  }

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

// Assets CRUD
export async function createAsset(
  client: DbClient,
  data: TablesInsert<"assets">,
): Promise<ApiResponse<Tables<"assets">>> {
  try {
    const { data: asset, error } = await client
      .from("assets")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(asset);
  } catch (error) {
    return failure(error);
  }
}

export async function getAssetById(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"assets">>> {
  try {
    const { data, error } = await client
      .from("assets")
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

export async function listAssets(
  client: DbClient,
  params?: PaginationParams & { userId?: string },
): Promise<ApiResponse<PaginatedResponse<Tables<"assets">>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = client
      .from("assets")
      .select("*", { count: "exact" })
      .eq("is_deleted", false);

    if (params?.userId) {
      query = query.eq("user_id", params.userId);
    }

    const { data, error, count } = await query
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

export async function updateAsset(
  client: DbClient,
  id: string,
  data: TablesUpdate<"assets">,
): Promise<ApiResponse<Tables<"assets">>> {
  try {
    const { data: asset, error } = await client
      .from("assets")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(asset);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteAsset(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"assets">>> {
  try {
    const { data, error } = await client
      .from("assets")
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

// Asset Tags CRUD
export async function createAssetTag(
  client: DbClient,
  data: TablesInsert<"asset_tags">,
): Promise<ApiResponse<Tables<"asset_tags">>> {
  try {
    const { data: tag, error } = await client
      .from("asset_tags")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(tag);
  } catch (error) {
    return failure(error);
  }
}

export async function getAssetTags(
  client: DbClient,
  assetId: string,
): Promise<ApiResponse<Tables<"asset_tags">[]>> {
  try {
    const { data, error } = await client
      .from("asset_tags")
      .select("*")
      .eq("asset_id", assetId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteAssetTag(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"asset_tags">>> {
  try {
    const { data, error } = await client
      .from("asset_tags")
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

// Asset Images CRUD
export async function createAssetImage(
  client: DbClient,
  data: TablesInsert<"asset_images">,
): Promise<ApiResponse<Tables<"asset_images">>> {
  try {
    const { data: image, error } = await client
      .from("asset_images")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(image);
  } catch (error) {
    return failure(error);
  }
}

export async function getAssetImages(
  client: DbClient,
  assetId: string,
): Promise<ApiResponse<Tables<"asset_images">[]>> {
  try {
    const { data, error } = await client
      .from("asset_images")
      .select("*")
      .eq("asset_id", assetId)
      .eq("is_deleted", false)
      .order("position", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateAssetImage(
  client: DbClient,
  id: number,
  data: TablesUpdate<"asset_images">,
): Promise<ApiResponse<Tables<"asset_images">>> {
  try {
    const { data: image, error } = await client
      .from("asset_images")
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

export async function softDeleteAssetImage(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"asset_images">>> {
  try {
    const { data, error } = await client
      .from("asset_images")
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

// Asset Files CRUD
export async function createAssetFile(
  client: DbClient,
  data: TablesInsert<"asset_files">,
): Promise<ApiResponse<Tables<"asset_files">>> {
  try {
    const { data: file, error } = await client
      .from("asset_files")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(file);
  } catch (error) {
    return failure(error);
  }
}

export async function getAssetFiles(
  client: DbClient,
  assetId: string,
): Promise<ApiResponse<Tables<"asset_files">[]>> {
  try {
    const { data, error } = await client
      .from("asset_files")
      .select("*")
      .eq("asset_id", assetId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateAssetFile(
  client: DbClient,
  id: number,
  data: TablesUpdate<"asset_files">,
): Promise<ApiResponse<Tables<"asset_files">>> {
  try {
    const { data: file, error } = await client
      .from("asset_files")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(file);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteAssetFile(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"asset_files">>> {
  try {
    const { data, error } = await client
      .from("asset_files")
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

// Asset Royalties CRUD
export async function createAssetRoyalty(
  client: DbClient,
  data: TablesInsert<"asset_royalties">,
): Promise<ApiResponse<Tables<"asset_royalties">>> {
  try {
    const { data: royalty, error } = await client
      .from("asset_royalties")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(royalty);
  } catch (error) {
    return failure(error);
  }
}

export async function getAssetRoyalties(
  client: DbClient,
  assetId: string,
): Promise<ApiResponse<Tables<"asset_royalties">[]>> {
  try {
    const { data, error } = await client
      .from("asset_royalties")
      .select("*")
      .eq("asset_id", assetId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateAssetRoyalty(
  client: DbClient,
  id: number,
  data: TablesUpdate<"asset_royalties">,
): Promise<ApiResponse<Tables<"asset_royalties">>> {
  try {
    const { data: royalty, error } = await client
      .from("asset_royalties")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(royalty);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteAssetRoyalty(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"asset_royalties">>> {
  try {
    const { data, error } = await client
      .from("asset_royalties")
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

// Asset Licenses CRUD
export async function createAssetLicense(
  client: DbClient,
  data: TablesInsert<"asset_licenses">,
): Promise<ApiResponse<Tables<"asset_licenses">>> {
  try {
    const { data: assetLicense, error } = await client
      .from("asset_licenses")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(assetLicense);
  } catch (error) {
    return failure(error);
  }
}

export async function getAssetLicenses(
  client: DbClient,
  assetId: string,
): Promise<ApiResponse<Tables<"asset_licenses">[]>> {
  try {
    const { data, error } = await client
      .from("asset_licenses")
      .select("*")
      .eq("asset_id", assetId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateAssetLicense(
  client: DbClient,
  id: number,
  data: TablesUpdate<"asset_licenses">,
): Promise<ApiResponse<Tables<"asset_licenses">>> {
  try {
    const { data: assetLicense, error } = await client
      .from("asset_licenses")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(assetLicense);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteAssetLicense(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"asset_licenses">>> {
  try {
    const { data, error } = await client
      .from("asset_licenses")
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

// Asset License Acceptances CRUD
export async function createAssetLicenseAcceptance(
  client: DbClient,
  data: TablesInsert<"asset_license_acceptances">,
): Promise<ApiResponse<Tables<"asset_license_acceptances">>> {
  try {
    const { data: acceptance, error } = await client
      .from("asset_license_acceptances")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(acceptance);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserAssetLicenseAcceptances(
  client: DbClient,
  userId: string,
): Promise<ApiResponse<Tables<"asset_license_acceptances">[]>> {
  try {
    const { data, error } = await client
      .from("asset_license_acceptances")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("accepted_at", { ascending: false });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

// Asset To Products CRUD
export async function createAssetToProduct(
  client: DbClient,
  data: TablesInsert<"asset_to_products">,
): Promise<ApiResponse<Tables<"asset_to_products">>> {
  try {
    const { data: link, error } = await client
      .from("asset_to_products")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(link);
  } catch (error) {
    return failure(error);
  }
}

export async function getProductAssets(
  client: DbClient,
  productId: string,
): Promise<ApiResponse<Tables<"asset_to_products">[]>> {
  try {
    const { data, error } = await client
      .from("asset_to_products")
      .select("*")
      .eq("product_id", productId);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function removeAssetFromProduct(
  client: DbClient,
  id: number,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client
      .from("asset_to_products")
      .delete()
      .eq("id", id);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}
