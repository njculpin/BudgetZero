import { SupabaseClient } from "@supabase/supabase-js";
import {
  Asset,
  AssetWithCreator,
  CreateAssetData,
  ApiResponse,
  PaginatedResponse,
} from "@/lib/types/database";

export class AssetService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new asset
   */
  async createAsset(
    userId: string,
    assetData: Omit<CreateAssetData, "creator_id">
  ): Promise<ApiResponse<Asset>> {
    try {
      const { data, error } = await this.supabase
        .from("assets")
        .insert([
          {
            ...assetData,
            creator_id: userId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating asset:", error);
        return { error: "Failed to create asset" };
      }

      return { data };
    } catch (error) {
      console.error("Unexpected error creating asset:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Get public assets with filtering
   */
  async getPublicAssets(
    filters: {
      asset_type?: string;
      model_category?: string;
      tags?: string[];
      is_game_ready?: boolean;
      license_type?: string;
      max_polygon_count?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<AssetWithCreator>>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from("assets")
        .select(
          `
          *,
          creator:profiles!creator_id (*)
        `,
          { count: "exact" }
        )
        .eq("is_public", true);

      // Apply filters
      if (filters.asset_type) {
        query = query.eq("asset_type", filters.asset_type);
      }
      if (filters.tags && filters.tags.length > 0) {
        // Use contains for AND logic (all tags must match)
        query = query.contains("tags", filters.tags);
      }
      if (filters.is_game_ready !== undefined) {
        query = query.eq("is_game_ready", filters.is_game_ready);
      }
      if (filters.license_type) {
        query = query.eq("license_type", filters.license_type);
      }
      if (filters.max_polygon_count) {
        query = query.lte("polygon_count", filters.max_polygon_count);
      }
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Pagination
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching assets:", error);
        return { error: "Failed to fetch assets" };
      }

      return {
        data: {
          data: data || [],
          count: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit,
        },
      };
    } catch (error) {
      console.error("Unexpected error fetching assets:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Get a single asset by ID
   */
  async getAssetById(
    assetId: string
  ): Promise<ApiResponse<AssetWithCreator>> {
    try {
      const { data, error } = await this.supabase
        .from("assets")
        .select(
          `
          *,
          creator:profiles!creator_id (*)
        `
        )
        .eq("id", assetId)
        .single();

      if (error) {
        console.error("Error fetching asset:", error);
        return { error: "Asset not found" };
      }

      return { data };
    } catch (error) {
      console.error("Unexpected error fetching asset:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Get assets created by a specific user
   */
  async getUserAssets(
    userId: string,
    filters: {
      asset_type?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<Asset>>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from("assets")
        .select("*", { count: "exact" })
        .eq("creator_id", userId);

      if (filters.asset_type) {
        query = query.eq("asset_type", filters.asset_type);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching user assets:", error);
        return { error: "Failed to fetch assets" };
      }

      return {
        data: {
          data: data || [],
          count: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit,
        },
      };
    } catch (error) {
      console.error("Unexpected error fetching user assets:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Update an asset
   */
  async updateAsset(
    assetId: string,
    userId: string,
    updates: Partial<CreateAssetData>
  ): Promise<ApiResponse<Asset>> {
    try {
      // Verify ownership
      const { data: existing, error: fetchError } = await this.supabase
        .from("assets")
        .select("creator_id")
        .eq("id", assetId)
        .single();

      if (fetchError || !existing) {
        return { error: "Asset not found" };
      }

      if (existing.creator_id !== userId) {
        return { error: "Unauthorized" };
      }

      // Remove creator_id from updates if present
      const { creator_id, ...safeUpdates } = updates as any;

      const { data, error } = await this.supabase
        .from("assets")
        .update(safeUpdates)
        .eq("id", assetId)
        .select()
        .single();

      if (error) {
        console.error("Error updating asset:", error);
        return { error: "Failed to update asset" };
      }

      return { data };
    } catch (error) {
      console.error("Unexpected error updating asset:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(
    assetId: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Verify ownership
      const { data: existing, error: fetchError } = await this.supabase
        .from("assets")
        .select("creator_id")
        .eq("id", assetId)
        .single();

      if (fetchError || !existing) {
        return { error: "Asset not found" };
      }

      if (existing.creator_id !== userId) {
        return { error: "Unauthorized" };
      }

      const { error } = await this.supabase
        .from("assets")
        .delete()
        .eq("id", assetId);

      if (error) {
        console.error("Error deleting asset:", error);
        return { error: "Failed to delete asset" };
      }

      return { data: true };
    } catch (error) {
      console.error("Unexpected error deleting asset:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(
    assetId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.supabase.rpc("increment_download_count", {
        asset_id: assetId,
      });

      if (error) {
        console.error("Error incrementing download count:", error);
        return { error: "Failed to update download count" };
      }

      return { data: true };
    } catch (error) {
      console.error("Unexpected error:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Get popular models (most downloaded or used)
   */
  async getPopularModels(
    limit: number = 10
  ): Promise<ApiResponse<AssetWithCreator[]>> {
    try {
      const { data, error } = await this.supabase
        .from("assets")
        .select(
          `
          *,
          creator:profiles!creator_id (*)
        `
        )
        .eq("asset_type", "model")
        .eq("is_public", true)
        .order("download_count", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching popular models:", error);
        return { error: "Failed to fetch popular models" };
      }

      return { data: data || [] };
    } catch (error) {
      console.error("Unexpected error fetching popular models:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Get model categories (distinct values)
   */
  async getModelCategories(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await this.supabase
        .from("assets")
        .select("model_category")
        .eq("asset_type", "model")
        .eq("is_public", true)
        .not("model_category", "is", null);

      if (error) {
        console.error("Error fetching categories:", error);
        return { error: "Failed to fetch categories" };
      }

      // Extract unique categories
      const categories = Array.from(
        new Set(data?.map((item) => item.model_category).filter(Boolean))
      ).sort();

      return { data: categories as string[] };
    } catch (error) {
      console.error("Unexpected error fetching categories:", error);
      return { error: "Unexpected error occurred" };
    }
  }
}