import type { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";
import type { ApiResponse, DbClient } from "../shared/types";
import { failure, success } from "../shared/utils";

// Licenses CRUD
export async function createLicense(
  client: DbClient,
  data: TablesInsert<"licenses">,
): Promise<ApiResponse<Tables<"licenses">>> {
  try {
    const { data: license, error } = await client
      .from("licenses")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(license);
  } catch (error) {
    return failure(error);
  }
}

export async function getLicenseById(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"licenses">>> {
  try {
    const { data, error } = await client
      .from("licenses")
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

export async function listLicenses(
  client: DbClient,
): Promise<ApiResponse<Tables<"licenses">[]>> {
  try {
    const { data, error } = await client
      .from("licenses")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateLicense(
  client: DbClient,
  id: string,
  data: TablesUpdate<"licenses">,
): Promise<ApiResponse<Tables<"licenses">>> {
  try {
    const { data: license, error } = await client
      .from("licenses")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(license);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteLicense(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"licenses">>> {
  try {
    const { data, error } = await client
      .from("licenses")
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
