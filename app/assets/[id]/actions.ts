"use server";

import { revalidatePath } from "next/cache";
import {
  createAssetLicense,
  createAssetRoyalty,
  getAssetById,
  getAssetFiles,
  getAssetImages,
  updateAsset as sdkUpdateAsset,
  updateAssetLicense as sdkUpdateAssetLicense,
  updateAssetRoyalty as sdkUpdateAssetRoyalty,
  softDeleteAsset,
} from "@/lib/sdk/server/assets";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";

export async function updateAsset(
  assetId: string,
  data: {
    title: string;
    description?: string;
    is_public: boolean;
  },
) {
  try {
    const user = await getMe();
    const client = await createClient();

    // Verify ownership using SDK
    const assetResult = await getAssetById(assetId);
    if (assetResult.error || !assetResult.data) {
      return {
        success: false,
        error: assetResult.error?.message || "Asset not found",
      };
    }

    if (assetResult.data.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update asset using SDK
    const updateResult = await sdkUpdateAsset(client, assetId, {
      title: data.title,
      description: data.description || null,
      is_public: data.is_public,
    });

    if (updateResult.error) {
      return {
        success: false,
        error: updateResult.error?.message || "Update failed",
      };
    }

    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/assets");

    return { success: true };
  } catch (error) {
    console.error("Update asset error:", error);
    return { success: false, error: "Failed to update asset" };
  }
}

export async function deleteAsset(assetId: string) {
  try {
    const user = await getMe();
    const client = await createClient();

    // Verify ownership using SDK
    const assetResult = await getAssetById(assetId);
    if (assetResult.error || !assetResult.data) {
      return {
        success: false,
        error: assetResult.error?.message || "Asset not found",
      };
    }

    if (assetResult.data.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all files and images to delete from storage using SDK
    const filesResult = await getAssetFiles(client, assetId);
    const imagesResult = await getAssetImages(client, assetId);

    // Delete files from storage (direct storage access needed)
    if (!filesResult.error && filesResult.data && filesResult.data.length > 0) {
      const filePaths = filesResult.data.map((f) => f.storage_path);
      await client.storage.from("assets").remove(filePaths);
    }

    // Delete images from storage (direct storage access needed)
    if (
      !imagesResult.error &&
      imagesResult.data &&
      imagesResult.data.length > 0
    ) {
      const imagePaths = imagesResult.data.map((i) => i.storage_path);
      await client.storage.from("assets").remove(imagePaths);
    }

    // Soft delete the asset (cascading soft deletes handled by database triggers)
    const deleteResult = await softDeleteAsset(client, assetId);

    if (deleteResult.error) {
      return {
        success: false,
        error: deleteResult.error?.message || "Delete failed",
      };
    }

    revalidatePath("/assets");

    return { success: true };
  } catch (error) {
    console.error("Delete asset error:", error);
    return { success: false, error: "Failed to delete asset" };
  }
}

export async function upsertAssetRoyalty(
  assetId: string,
  userId: string,
  royaltyId: number | null,
  data: {
    royalty_type: "percentage" | "fixed";
    royalty_value: number;
  },
) {
  try {
    const user = await getMe();
    const client = await createClient();

    // Verify ownership
    const assetResult = await getAssetById(assetId);
    if (assetResult.error || !assetResult.data) {
      return {
        success: false,
        error: assetResult.error?.message || "Asset not found",
      };
    }

    if (assetResult.data.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (royaltyId) {
      // Update existing royalty
      const updateResult = await sdkUpdateAssetRoyalty(client, royaltyId, {
        royalty_type: data.royalty_type,
        royalty_value: data.royalty_value,
      });

      if (updateResult.error) {
        return {
          success: false,
          error: updateResult.error?.message || "Update failed",
        };
      }
    } else {
      // Create new royalty
      const createResult = await createAssetRoyalty(client, {
        asset_id: assetId,
        user_id: userId,
        royalty_type: data.royalty_type,
        royalty_value: data.royalty_value,
      });

      if (createResult.error) {
        return {
          success: false,
          error: createResult.error?.message || "Create failed",
        };
      }
    }

    revalidatePath(`/assets/${assetId}`);
    return { success: true };
  } catch (error) {
    console.error("Upsert asset royalty error:", error);
    return { success: false, error: "Failed to save royalty settings" };
  }
}

export async function upsertAssetLicense(
  assetId: string,
  licenseId: number | null,
  data: {
    license_id: number;
  },
) {
  try {
    const user = await getMe();
    const client = await createClient();

    // Verify ownership
    const assetResult = await getAssetById(assetId);
    if (assetResult.error || !assetResult.data) {
      return {
        success: false,
        error: assetResult.error?.message || "Asset not found",
      };
    }

    if (assetResult.data.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (licenseId) {
      // Update existing license
      const updateResult = await sdkUpdateAssetLicense(client, licenseId, {
        license_id: String(data.license_id),
        is_active: true,
      });

      if (updateResult.error) {
        return {
          success: false,
          error: updateResult.error?.message || "Update failed",
        };
      }
    } else {
      // Create new license
      const createResult = await createAssetLicense(client, {
        asset_id: assetId,
        license_id: String(data.license_id),
        is_active: true,
      });

      if (createResult.error) {
        return {
          success: false,
          error: createResult.error?.message || "Create failed",
        };
      }
    }

    revalidatePath(`/assets/${assetId}`);
    return { success: true };
  } catch (error) {
    console.error("Upsert asset license error:", error);
    return { success: false, error: "Failed to save license settings" };
  }
}
