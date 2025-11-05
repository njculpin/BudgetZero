import type { Jam, Product, JamProductReview } from "@/types";
import { serverClient } from "./client";
import { generateHandle } from "./handles";

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
 * Create a new jam for a user (draft state)
 */
export const createJam = async (userId: string): Promise<Jam | null> => {
  const baseHandle = generateHandle();
  const handle = await generateUniqueHandle(baseHandle);

  // Create with default dates (7 days from now)
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 7);

  const { data, error } = await serverClient
    .from("jams")
    .insert({
      user_id: userId,
      handle: handle,
      title: handle,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'upcoming', // Will be draft in future when we add status management
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating jam:", error);
    return null;
  }

  return data as Jam;
};

/**
 * Update jam details
 */
export const updateJam = async (
  jamId: string,
  updates: {
    title?: string;
    description?: string;
    rules?: string;
    start_date?: string;
    end_date?: string;
    preview_image_url?: string | null;
    preview_image_storage_path?: string | null;
    preview_image_mime_type?: string | null;
  }
): Promise<Jam | null> => {
  const { data, error } = await serverClient
    .from("jams")
    .update(updates)
    .eq("id", jamId)
    .select()
    .single();

  if (error) {
    console.error("Error updating jam:", error);
    return null;
  }

  return data as Jam;
};

/**
 * Validate that jam dates follow Monday-Sunday pattern
 * and don't conflict with existing jams
 */
export const validateJamDates = async (
  jamId: string,
  startDate: Date,
  endDate: Date
): Promise<{ valid: boolean; error?: string }> => {
  // Check if start is Monday
  const startDay = startDate.getDay();
  if (startDay !== 1) {
    return { valid: false, error: "Start date must be a Monday" };
  }

  // Check if end is Sunday
  const endDay = endDate.getDay();
  if (endDay !== 0) {
    return { valid: false, error: "End date must be a Sunday" };
  }

  // Check if they're in the same week
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff !== 6) {
    return {
      valid: false,
      error: "Jam must run for exactly one week (Monday-Sunday)",
    };
  }

  // Check for conflicting jams in the same week
  const { data, error } = await serverClient
    .from("jams")
    .select("id")
    .eq("deleted", false)
    .neq("id", jamId) // Exclude current jam
    .gte("start_date", startDate.toISOString())
    .lte("start_date", endDate.toISOString());

  if (error) {
    console.error("Error checking for conflicting jams:", error);
    return { valid: false, error: "Failed to validate dates" };
  }

  if (data && data.length > 0) {
    return {
      valid: false,
      error: "Another jam is already scheduled for this week",
    };
  }

  return { valid: true };
};

/**
 * Get a jam by handle
 */
export const getJamByHandle = async (handle: string): Promise<Jam | null> => {
  const { data, error } = await serverClient
    .from("jams")
    .select("*")
    .eq("handle", handle)
    .eq("deleted", false)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Jam;
};

/**
 * Get a random active jam
 * Returns null if no active jams exist
 */
export const getActiveJam = async (): Promise<Jam | null> => {
  const { data, error } = await serverClient
    .from("jams")
    .select("*")
    .eq("deleted", false)
    .eq("status", "active")
    .limit(10);

  if (error || !data || data.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex] as Jam;
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

/**
 * Get all products submitted to a jam
 */
export const getJamProducts = async (jamId: string): Promise<Product[]> => {
  const { data: jamProductsData, error: jamProductsError } = await serverClient
    .from("jam_products")
    .select("product_id")
    .eq("jam_id", jamId)
    .eq("deleted", false);

  if (jamProductsError || !jamProductsData || jamProductsData.length === 0) {
    return [];
  }

  const productIds = jamProductsData.map((jp) => jp.product_id);

  const { data: productsData, error: productsError } = await serverClient
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("deleted", false);

  if (productsError || !productsData) {
    return [];
  }

  return productsData as Product[];
};

/**
 * Get reviews for products in a jam
 */
export const getJamProductReviews = async (
  jamId: string
): Promise<JamProductReview[]> => {
  const { data, error } = await serverClient
    .from("jam_product_reviews")
    .select("*")
    .eq("jam_id", jamId)
    .eq("deleted", false);

  if (error || !data) {
    return [];
  }

  return data as JamProductReview[];
};

/**
 * Get average rating for products in a jam
 * Returns a map of product_id to { average_rating, review_count }
 */
export const getJamProductRatings = async (
  jamId: string
): Promise<Map<string, { averageRating: number; reviewCount: number }>> => {
  const reviews = await getJamProductReviews(jamId);

  const ratingsMap = new Map<
    string,
    { averageRating: number; reviewCount: number }
  >();

  const productReviews = new Map<string, number[]>();

  for (const review of reviews) {
    if (!productReviews.has(review.product_id)) {
      productReviews.set(review.product_id, []);
    }
    productReviews.get(review.product_id)!.push(review.review_rating);
  }

  for (const [productId, ratings] of productReviews.entries()) {
    const averageRating =
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    ratingsMap.set(productId, {
      averageRating,
      reviewCount: ratings.length,
    });
  }

  return ratingsMap;
};
