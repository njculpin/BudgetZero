import { createClient } from "@/lib/supabase/server";

export interface ProjectAsset {
  id: string;
  project_id: string;
  asset_id: string;
  usage_context?: string;
  added_by: string;
  added_at: string;
}

export interface AssetWithDetails extends ProjectAsset {
  asset: {
    id: string;
    name: string;
    description?: string;
    thumbnail_url?: string;
    file_url: string;
    creator_id: string;
    license_type: string;
    creator: {
      id: string;
      full_name?: string;
      username?: string;
    };
  };
}

export class AssetIntegrationService {
  /**
   * Add an asset to a project
   */
  static async addAssetToProject(params: {
    projectId: string;
    assetId: string;
    usageContext?: string;
  }): Promise<{ success: boolean; data?: ProjectAsset; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("project_assets")
      .insert({
        project_id: params.projectId,
        asset_id: params.assetId,
        usage_context: params.usageContext,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return { success: false, error: "Asset already added to this project" };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Remove an asset from a project
   */
  static async removeAssetFromProject(params: {
    projectId: string;
    assetId: string;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("project_assets")
      .delete()
      .eq("project_id", params.projectId)
      .eq("asset_id", params.assetId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get all assets used in a project
   */
  static async getProjectAssets(
    projectId: string
  ): Promise<{ success: boolean; data?: AssetWithDetails[]; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_assets")
      .select(
        `
        *,
        asset:assets!project_assets_asset_id_fkey (
          id,
          name,
          description,
          thumbnail_url,
          file_url,
          creator_id,
          license_type,
          creator:profiles!assets_creator_id_fkey (
            id,
            full_name,
            username
          )
        )
      `
      )
      .eq("project_id", projectId)
      .order("added_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AssetWithDetails[] };
  }

  /**
   * Get all projects using a specific asset
   */
  static async getAssetUsage(
    assetId: string
  ): Promise<{
    success: boolean;
    data?: Array<{ project_id: string; project_title: string; added_at: string }>;
    error?: string;
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_assets")
      .select(
        `
        project_id,
        added_at,
        project:game_projects!project_assets_project_id_fkey (
          title
        )
      `
      )
      .eq("asset_id", assetId)
      .order("added_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const formatted = data.map((item: { project_id: string; added_at: string; project: { title: string } }) => ({
      project_id: item.project_id,
      project_title: item.project.title,
      added_at: item.added_at,
    }));

    return { success: true, data: formatted };
  }

  /**
   * Check if an asset is already in a project
   */
  static async isAssetInProject(params: {
    projectId: string;
    assetId: string;
  }): Promise<{ success: boolean; exists: boolean; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_assets")
      .select("id")
      .eq("project_id", params.projectId)
      .eq("asset_id", params.assetId)
      .maybeSingle();

    if (error) {
      return { success: false, exists: false, error: error.message };
    }

    return { success: true, exists: !!data };
  }

  /**
   * Update usage context for an asset in a project
   */
  static async updateUsageContext(params: {
    projectId: string;
    assetId: string;
    usageContext: string;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("project_assets")
      .update({ usage_context: params.usageContext })
      .eq("project_id", params.projectId)
      .eq("asset_id", params.assetId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}