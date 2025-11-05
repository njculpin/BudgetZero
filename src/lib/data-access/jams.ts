import type { Jam } from "@/types";
import { serverClient } from "./client";

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
