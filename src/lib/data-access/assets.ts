import { serverClient } from "./client";
import type {
  Asset,
  AssetFile,
  AssetImage,
  AssetTag,
  AssetStatus,
  User,
} from "@/types";
import { generateHandle } from "./handles";

export interface CreateAssetParams {
  handle: string;
}

export interface UpdateAssetParams {
  title?: string;
  description?: string;
  status?: AssetStatus;
  handle?: string;
}

/**
 * Generate a unique handle with collision handling
 */
const generateUniqueHandle = async (baseHandle: string): Promise<string> => {
  let handle = baseHandle;
  let counter = 1;
  let isAvailable = await checkHandleAvailability(handle);

  while (!isAvailable) {
    handle = `${baseHandle}-${counter}`;
    counter++;
    isAvailable = await checkHandleAvailability(handle);
  }

  return handle;
};

/**
 * Create a new asset
 */
export const createAsset = async (userId: string): Promise<Asset | null> => {
  const baseHandle = generateHandle();
  const handle = await generateUniqueHandle(baseHandle);
  const { data, error } = await serverClient
    .from("assets")
    .insert({
      user_id: userId,
      handle: handle,
      title: handle,
      description: "",
      status: "draft",
      download_count: 0,
      total_size_bytes: 0,
      file_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating asset:", error);
    return null;
  }

  const asset = data as Asset;

  // Automatically create a 100% royalty for the owner
  const { error: royaltyError } = await serverClient
    .from("asset_royalties")
    .insert({
      asset_id: asset.id,
      user_id: userId,
      royalty_type: "percentage",
      royalty_value: 100,
    });

  if (royaltyError) {
    console.error("Error creating default royalty:", royaltyError);
    // Don't fail asset creation if royalty creation fails
  }

  // Automatically add creator to collaborators list
  const { error: contributorError } = await serverClient
    .from("asset_collaborators")
    .insert({
      asset_id: asset.id,
      user_id: userId,
    });

  if (contributorError) {
    console.error("Error creating contributor:", royaltyError);
  }

  return asset;
};

/**
 * Fetch asset by ID
 * Returns null if asset doesn't exist or is deleted
 */
export const getAssetById = async (assetId: string): Promise<Asset | null> => {
  const { data, error } = await serverClient
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("deleted", false)
    .single();

  if (error) {
    return null;
  }

  return data as Asset;
};

/**
 * Fetch asset by handle (case-insensitive)
 * Returns null if asset doesn't exist or is deleted
 */
export const getAssetByHandle = async (
  handle: string
): Promise<Asset | null> => {
  const { data, error } = await serverClient
    .from("assets")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error) {
    return null;
  }

  return data as Asset;
};

/**
 * Fetch all assets for a user
 * Optionally filter by status
 */
export const getUserAssets = async (
  userId: string,
  status?: AssetStatus
): Promise<Asset[]> => {
  let query = serverClient
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user assets:", error);
    return [];
  }

  return data as Asset[];
};

/**
 * Get all published assets with optional search and tag filtering
 * @param searchQuery - Search in title and description
 * @param tags - Filter by tag values
 * @param limit - Maximum number of results (default: 50)
 * @param offset - Pagination offset (default: 0)
 */
export const getAssets = async (
  searchQuery?: string,
  tags?: string[],
  limit: number = 50,
  offset: number = 0
): Promise<Asset[]> => {
  let query = serverClient
    .from("assets")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply search filter if provided
  if (searchQuery && searchQuery.trim()) {
    query = query.or(`title.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching published assets:", error);
    return [];
  }

  let assets = data as Asset[];

  // Filter by tags if provided (requires additional query since tags are in separate table)
  if (tags && tags.length > 0) {
    const assetIds = new Set<string>();

    for (const tag of tags) {
      const { data: tagData } = await serverClient
        .from("asset_tags")
        .select("asset_id")
        .eq("value", tag.toLowerCase())
        .eq("deleted", false);

      if (tagData) {
        tagData.forEach((t) => assetIds.add(t.asset_id));
      }
    }

    // Filter assets to only include those with matching tags
    assets = assets.filter((asset) => assetIds.has(asset.id));
  }

  return assets;
};

/**
 * Update asset
 * Throws error if handle is taken by another asset
 * Automatically generates handle from title if title is updated
 */
export const updateAsset = async (
  assetId: string,
  updates: UpdateAssetParams
): Promise<Asset | null> => {
  const updatesToApply = { ...updates };

  // If updating title, generate new handle from it
  if (updates.title) {
    // Generate handle from title: lowercase, remove special chars, spaces to dashes
    const titleSlug = updates.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
      .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

    // Check if new handle is available (excluding current asset)
    const isAvailable = await checkHandleAvailability(titleSlug, assetId);

    if (isAvailable) {
      updatesToApply.handle = titleSlug;
    } else {
      // If handle is taken, try with a unique suffix
      let counter = 1;
      let uniqueHandle = `${titleSlug}-${counter}`;
      let available = await checkHandleAvailability(uniqueHandle, assetId);

      while (!available) {
        counter++;
        uniqueHandle = `${titleSlug}-${counter}`;
        available = await checkHandleAvailability(uniqueHandle, assetId);
      }

      updatesToApply.handle = uniqueHandle;
    }
  }

  const { error } = await serverClient
    .from("assets")
    .update({
      ...updatesToApply,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (error) {
    throw error;
  }

  // Fetch and return the updated asset
  return getAssetById(assetId);
};

/**
 * Check if a handle is available for assets
 * @param handle - The handle to check
 * @param currentAssetId - Optional: ID of current asset (to allow keeping its own handle)
 */
export const checkHandleAvailability = async (
  handle: string,
  currentAssetId?: string
): Promise<boolean> => {
  let query = serverClient
    .from("assets")
    .select("id")
    .eq("handle", handle)
    .eq("deleted", false);

  // If checking for current asset, exclude its own record
  if (currentAssetId) {
    query = query.neq("id", currentAssetId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking handle availability:", error);
    return false;
  }

  // Handle is available if no records found
  return !data || data.length === 0;
};

/**
 * Get asset files for an asset
 */
export const getAssetFiles = async (assetId: string): Promise<AssetFile[]> => {
  const { data, error } = await serverClient
    .from("asset_files")
    .select("*")
    .eq("asset_id", assetId)
    .eq("deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching asset files:", error);
    return [];
  }

  return data as AssetFile[];
};

/**
 * Get asset file by ID
 */
export const getAssetFileById = async (
  fileId: string
): Promise<AssetFile | null> => {
  const { data, error } = await serverClient
    .from("asset_files")
    .select("*")
    .eq("id", fileId)
    .eq("deleted", false)
    .single();

  if (error) {
    return null;
  }

  return data as AssetFile;
};

/**
 * Get asset images for an asset
 */
export const getAssetImages = async (
  assetId: string
): Promise<AssetImage[]> => {
  const { data, error } = await serverClient
    .from("asset_images")
    .select("*")
    .eq("asset_id", assetId)
    .eq("deleted", false)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching asset images:", error);
    return [];
  }

  return data as AssetImage[];
};

/**
 * Get asset contributors for an asset
 */
export const getAssetContributors = async (
  assetId: string
): Promise<User[]> => {
  const { data: users, error: contributorErrors } = await serverClient
    .from("asset_collaborators")
    .select("user_id")
    .eq("asset_id", assetId);

  if (contributorErrors) {
    console.error("Error fetching asset contributors:", contributorErrors);
    return [];
  }

  const userIds = users.map((x) => x.user_id);

  const { data, error } = await serverClient
    .from("users")
    .select("*")
    .in("id", userIds);

  if (error) {
    console.error("Error fetching asset images:", error);
    return [];
  }

  return data as User[];
};

/**
 * Create asset file record
 */
export const createAssetFile = async (
  assetId: string,
  fileData: {
    title: string;
    description?: string;
    file_url: string;
    storage_path: string;
    file_size_bytes: number;
    mime_type: string;
  }
): Promise<AssetFile | null> => {
  const { data, error } = await serverClient
    .from("asset_files")
    .insert({
      asset_id: assetId,
      title: fileData.title,
      description: fileData.description || "",
      file_url: fileData.file_url,
      storage_path: fileData.storage_path,
      file_size_bytes: fileData.file_size_bytes,
      mime_type: fileData.mime_type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating asset file:", error);
    return null;
  }

  return data as AssetFile;
};

/**
 * Create asset image record
 * Requires authenticated client for RLS
 */
export const createAssetImage = async (
  assetId: string,
  imageData: {
    title: string;
    description?: string;
    file_url: string;
    storage_path: string;
    file_size_bytes: number;
    mime_type: string;
  }
): Promise<AssetImage | null> => {
  const { data, error } = await serverClient
    .from("asset_images")
    .insert({
      asset_id: assetId,
      title: imageData.title,
      description: imageData.description || "",
      file_url: imageData.file_url,
      storage_path: imageData.storage_path,
      file_size_bytes: imageData.file_size_bytes,
      mime_type: imageData.mime_type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating asset image:", error);
    return null;
  }

  return data as AssetImage;
};

/**
 * Delete asset file (soft delete)
 * Requires authenticated client for RLS
 */
export const deleteAssetFile = async (fileId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from("asset_files")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", fileId);

  if (error) {
    console.error("Error deleting asset file:", error);
    return false;
  }

  return true;
};

/**
 * Delete asset image (soft delete)
 * Requires authenticated client for RLS
 */
export const deleteAssetImage = async (imageId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from("asset_images")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", imageId);

  if (error) {
    console.error("Error deleting asset image:", error);
    return false;
  }

  return true;
};

/**
 * Delete asset (soft delete)
 * Requires authenticated client for RLS
 */
export const deleteAsset = async (assetId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from("assets")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (error) {
    console.error("Error deleting asset:", error);
    return false;
  }

  return true;
};

/**
 * Create asset tag
 * Prevents duplicate tags for the same asset
 * Requires authenticated client for RLS
 */
export const createAssetTag = async (
  assetId: string,
  value: string
): Promise<AssetTag | null> => {
  // Normalize the tag value
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue || normalizedValue.length > 50) {
    console.error("Invalid tag value");
    return null;
  }

  // Check if tag already exists for this asset
  const existingTags = await getAssetTags(assetId);
  const tagExists = existingTags.some(
    (tag) => tag.value.toLowerCase() === normalizedValue
  );

  if (tagExists) {
    console.error("Tag already exists for this asset");
    return null;
  }

  const { data, error } = await serverClient
    .from("asset_tags")
    .insert({
      asset_id: assetId,
      value: normalizedValue,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating asset tag:", error);
    return null;
  }

  return data as AssetTag;
};

/**
 * Get all tags for an asset
 */
export const getAssetTags = async (assetId: string): Promise<AssetTag[]> => {
  const { data, error } = await serverClient
    .from("asset_tags")
    .select("*")
    .eq("asset_id", assetId)
    .eq("deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching asset tags:", error);
    return [];
  }

  return data as AssetTag[];
};

/**
 * Delete asset tag (soft delete)
 * Requires authenticated client for RLS
 */
export const deleteAssetTag = async (tagId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from("asset_tags")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", tagId);

  if (error) {
    console.error("Error deleting asset tag:", error);
    return false;
  }

  return true;
};

/**
 * Get published assets
 * Returns only assets with status 'published'
 */
export const getPublishedAssets = async (
  searchTerm?: string,
  limit: number = 20,
  offset: number = 0
): Promise<Asset[]> => {
  let query = serverClient
    .from("assets")
    .select("*")
    .range(offset, offset + limit - 1);

  // Add search filter if provided
  if (searchTerm && searchTerm.trim().length > 0) {
    query = query.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching published assets:", error);
    return [];
  }

  return data as Asset[];
};

/**
 * Get popular tags across all published assets
 * Returns tags sorted by usage count (descending)
 * @param limit - Maximum number of tags to return (default: 20)
 */
export const getPopularTags = async (
  limit: number = 20
): Promise<{ value: string; count: number }[]> => {
  // const { data, error } = await serverClient
  //   .from("asset_tags")
  //   .select("value, asset_id")
  //   .eq("deleted", false);

  // if (error) {
  //   console.error("Error fetching popular tags:", error);
  //   return [];
  // }

  // // Count occurrences of each tag value
  // const tagCounts = new Map<string, number>();

  // data.forEach((tag) => {
  //   const count = tagCounts.get(tag.value) || 0;
  //   tagCounts.set(tag.value, count + 1);
  // });

  // // Convert to array and sort by count
  // const popularTags = Array.from(tagCounts.entries())
  //   .map(([value, count]) => ({ value, count }))
  //   .sort((a, b) => b.count - a.count)
  //   .slice(0, limit);

  return [];
};

/**
 * Reorder asset images
 * Updates position for each image in the provided array
 */
export const reorderAssetImages = async (
  imageOrders: Array<{ id: string; position: number }>
): Promise<boolean> => {
  try {
    for (const { id, position } of imageOrders) {
      const { error } = await serverClient
        .from("asset_images")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error reordering image:", error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error reordering images:", error);
    return false;
  }
};

/**
 * Reorder asset files
 * Updates position for each file in the provided array
 */
export const reorderAssetFiles = async (
  fileOrders: Array<{ id: string; position: number }>
): Promise<boolean> => {
  try {
    for (const { id, position } of fileOrders) {
      const { error } = await serverClient
        .from("asset_files")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error reordering file:", error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error reordering files:", error);
    return false;
  }
};
