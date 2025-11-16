import type {
  Jam,
  Product,
  JamProductReview,
  JamCategory,
  JamVote,
  VotingPhase,
  CategoryVotingResult,
} from "@/types";
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
 * Validate jam dates
 */
export const validateJamDates = async (
  jamId: string,
  startDate: Date,
  endDate: Date
): Promise<{ valid: boolean; error?: string }> => {
  // Check if start date is before end date
  if (startDate >= endDate) {
    return { valid: false, error: "Start date must be before end date" };
  }

  // Check for conflicting jams with overlapping dates
  const { data, error } = await serverClient
    .from("jams")
    .select("id, start_date, end_date")
    .eq("deleted", false)
    .neq("id", jamId); // Exclude current jam

  if (error) {
    console.error("Error checking for conflicting jams:", error);
    return { valid: false, error: "Failed to validate dates" };
  }

  // Check for date overlaps
  if (data && data.length > 0) {
    const hasConflict = data.some((jam) => {
      const existingStart = new Date(jam.start_date);
      const existingEnd = new Date(jam.end_date);

      // Check if there's any overlap
      return (
        (startDate >= existingStart && startDate <= existingEnd) ||
        (endDate >= existingStart && endDate <= existingEnd) ||
        (startDate <= existingStart && endDate >= existingEnd)
      );
    });

    if (hasConflict) {
      return {
        valid: false,
        error: "Another jam is already scheduled during this time period",
      };
    }
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
    .limit(10)

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

/**
 * Calculate the current voting phase for a jam
 */
export const calculateVotingPhase = (jam: Jam): VotingPhase => {
  const now = new Date();
  const startDate = new Date(jam.start_date);
  const endDate = new Date(jam.end_date);
  const votingEndDate = jam.voting_end_date
    ? new Date(jam.voting_end_date)
    : null;
  const resultsRevealDate = jam.results_reveal_date
    ? new Date(jam.results_reveal_date)
    : null;

  if (now < startDate) {
    return "upcoming";
  }

  if (now >= startDate && now <= endDate) {
    return "active";
  }

  if (votingEndDate && now > endDate && now <= votingEndDate) {
    return "voting";
  }

  if (
    resultsRevealDate &&
    votingEndDate &&
    now > votingEndDate &&
    now < resultsRevealDate
  ) {
    return "results_pending";
  }

  return "completed";
};

/**
 * Get all categories for a jam
 */
export const getJamCategories = async (
  jamId: string
): Promise<JamCategory[]> => {
  const { data, error } = await serverClient
    .from("jam_categories")
    .select("*")
    .eq("jam_id", jamId)
    .eq("deleted", false)
    .order("position");

  if (error) {
    console.error("Error fetching jam categories:", error);
    return [];
  }

  return (data as JamCategory[]) || [];
};

/**
 * Get all votes for a user in a jam
 */
export const getUserVotes = async (
  jamId: string,
  userId: string
): Promise<JamVote[]> => {
  const { data, error } = await serverClient
    .from("jam_votes")
    .select("*")
    .eq("jam_id", jamId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user votes:", error);
    return [];
  }

  return (data as JamVote[]) || [];
};

/**
 * Check if a user has submitted votes for a jam
 */
export const hasUserVoted = async (
  jamId: string,
  userId: string
): Promise<boolean> => {
  const { data, error } = await serverClient
    .from("jam_votes")
    .select("id")
    .eq("jam_id", jamId)
    .eq("user_id", userId)
    .not("submitted_at", "is", null)
    .limit(1);

  if (error) {
    console.error("Error checking if user voted:", error);
    return false;
  }

  return data !== null && data.length > 0;
};

/**
 * Get voting results for a specific category
 */
export const getCategoryResults = async (
  jamId: string,
  categoryId: string
): Promise<CategoryVotingResult | null> => {
  const { data: categoryData, error: categoryError } = await serverClient
    .from("jam_categories")
    .select("*")
    .eq("id", categoryId)
    .eq("jam_id", jamId)
    .single();

  if (categoryError || !categoryData) {
    console.error("Error fetching category:", categoryError);
    return null;
  }

  const { data: votesData, error: votesError } = await serverClient
    .from("jam_votes")
    .select("product_id")
    .eq("jam_id", jamId)
    .eq("category_id", categoryId)
    .not("submitted_at", "is", null);

  if (votesError) {
    console.error("Error fetching votes:", votesError);
    return null;
  }

  const voteCounts = new Map<string, number>();
  votesData?.forEach((vote) => {
    const count = voteCounts.get(vote.product_id) || 0;
    voteCounts.set(vote.product_id, count + 1);
  });

  const products = Array.from(voteCounts.entries())
    .map(([productId, voteCount]) => ({
      product_id: productId,
      vote_count: voteCount,
      rank: 0,
    }))
    .sort((a, b) => b.vote_count - a.vote_count);

  products.forEach((product, index) => {
    product.rank = index + 1;
  });

  return {
    category: categoryData as JamCategory,
    products,
  };
};

/**
 * Get voting results for all categories in a jam
 */
export const getAllCategoryResults = async (
  jamId: string
): Promise<CategoryVotingResult[]> => {
  const categories = await getJamCategories(jamId);
  const results = await Promise.all(
    categories.map((category) => getCategoryResults(jamId, category.id))
  );

  return results.filter(
    (result): result is CategoryVotingResult => result !== null
  );
};

/**
 * Create a new category for a jam
 */
export const createJamCategory = async (
  jamId: string,
  title: string,
  description: string,
  position?: number
): Promise<JamCategory | null> => {
  const { data, error } = await serverClient
    .from("jam_categories")
    .insert({
      jam_id: jamId,
      title,
      description,
      position: position ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating jam category:", error);
    return null;
  }

  return data as JamCategory;
};

/**
 * Update a jam category
 */
export const updateJamCategory = async (
  categoryId: string,
  updates: {
    title?: string;
    description?: string;
    position?: number;
  }
): Promise<JamCategory | null> => {
  const { data, error } = await serverClient
    .from("jam_categories")
    .update(updates)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    console.error("Error updating jam category:", error);
    return null;
  }

  return data as JamCategory;
};

/**
 * Delete a jam category (soft delete)
 */
export const deleteJamCategory = async (
  categoryId: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from("jam_categories")
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", categoryId);

  if (error) {
    console.error("Error deleting jam category:", error);
    return false;
  }

  return true;
};
