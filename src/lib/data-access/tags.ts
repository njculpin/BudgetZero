import { serverClient } from "./client";

export interface TagWithCount {
  value: string;
  count: number;
  assetCount: number;
  productCount: number;
}

/**
 * Get all unique tags from both products and assets with counts
 * Only includes tags from public products (excludes draft, private, archived)
 */
export const getAllTags = async (): Promise<TagWithCount[]> => {
  // Fetch product tags - only from public products
  const { data: productTagsData, error: productError } = await serverClient
    .from('product_tags')
    .select(`
      value,
      products!inner(status)
    `)
    .eq('deleted', false)
    .eq('products.deleted', false)
    .eq('products.status', 'public');

  if (productError) {
    console.error('Error fetching product tags:', productError);
  }

  // Count tags
  const tagCounts = new Map<string, { assetCount: number; productCount: number }>();

  // Count product tags (only from public products)
  if (productTagsData) {
    for (const tag of productTagsData as Array<{ value: string }>) {
      if (!tagCounts.has(tag.value)) {
        tagCounts.set(tag.value, { assetCount: 0, productCount: 0 });
      }
      tagCounts.get(tag.value)!.productCount++;
    }
  }

  // Convert to array and sort by total count
  return Array.from(tagCounts.entries())
    .map(([value, counts]) => ({
      value,
      assetCount: counts.assetCount,
      productCount: counts.productCount,
      count: counts.assetCount + counts.productCount,
    }))
    .sort((a, b) => b.count - a.count);
};
