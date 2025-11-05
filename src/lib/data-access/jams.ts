import type { Jam } from "@/types";
import { serverClient } from "./client";
import { generateHandle } from "./handles";
import { title } from "process";

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
 * Check if a handle is available for assets
 * @param handle - The handle to check
 * @param currentAssetId - Optional: ID of current asset (to allow keeping its own handle)
 */
export const checkHandleAvailability = async (
  handle: string,
  currentAssetId?: string
): Promise<boolean> => {
  let query = serverClient
    .from("jams")
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
 *
 * Create a new jam for a user
 */
export const createJam = async (userId: string): Promise<Jam | null> => {
  const baseHandle = generateHandle();
  const handle = await generateUniqueHandle(baseHandle);
  const { data, error } = await serverClient
    .from("jams")
    .insert({
      user_id: userId,
      handle: handle,
      title: handle,
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
    })
    .select()
    .single();
  if (error) {
    console.error("Error creating jam:", error);
    return null;
  } else {
    return data as Jam;
  }
};

/**
 * Get published products with optional filters
 */
export const getAllJams = async (
  searchQuery?: string,
  tags?: string[],
  limit: number = 50,
  offset: number = 0
): Promise<Jam[]> => {
  let query = serverClient
    .from("jams")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (searchQuery && searchQuery.trim()) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query;
  if (error) return [];

  let products = data as Jam[];

  if (tags && tags.length > 0) {
    const productIds = new Set<string>();
    for (const tag of tags) {
      const { data: tagData } = await serverClient
        .from("jam_tags")
        .select("jam_id")
        .eq("value", tag.toLowerCase())
        .eq("deleted", false);
      if (tagData) {
        tagData.forEach((t) => productIds.add(t.jam_id));
      }
    }
    products = products.filter((product) => productIds.has(product.id));
  }

  return products;
};
