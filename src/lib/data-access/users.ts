import { serverClient } from "./client";
import type { User, UserTag } from "@/types";

export interface UpdateUserProfileParams {
  name?: string;
  bio?: string;
  handle?: string;
  avatar_url?: string;
}

/**
 * Fetch user by ID
 * Returns null if user doesn't exist or is deleted
 */
export const getUsersByDateJoined = async (): Promise<User[] | []> => {
  const { data, error } = await serverClient
    .from("users")
    .select("id, handle, avatar_url")
    .limit(30);

  if (error) {
    return [];
  }

  return data as User[];
};

/**
 * Fetch user by ID
 * Returns null if user doesn't exist or is deleted
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await serverClient
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("deleted", false)
    .single();

  if (error) {
    return null;
  }

  return data as User;
};

/**
 * Fetch user by handle (case-insensitive)
 * Returns null if user doesn't exist or is deleted
 */
export const getUserByHandle = async (handle: string): Promise<User | null> => {
  const { data, error } = await serverClient
    .from("users")
    .select("*")
    .ilike("handle", handle)
    .eq("deleted", false)
    .single();

  if (error) {
    return null;
  }

  return data as User;
};

/**
 * Update user profile
 * Throws error if handle is taken by another user
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserProfileParams
): Promise<User | null> => {
  // If updating handle, check availability first
  if (updates.handle) {
    const isAvailable = await checkHandleAvailability(updates.handle, userId);
    if (!isAvailable) {
      throw new Error("Handle is already taken");
    }
  }

  const { error } = await serverClient
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  // Fetch and return the updated user
  return getUserById(userId);
};

/**
 * Check if a handle is available
 * @param handle - The handle to check
 * @param currentUserId - Optional: ID of current user (to allow keeping their own handle)
 */
export const checkHandleAvailability = async (
  handle: string,
  currentUserId?: string
): Promise<boolean> => {
  let query = serverClient
    .from("users")
    .select("id")
    .ilike("handle", handle)
    .eq("deleted", false);

  // If checking for current user, exclude their own record
  if (currentUserId) {
    query = query.neq("id", currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    return false;
  }

  // Handle is available if no records found
  return !data || data.length === 0;
};

/**
 * Search users by handle or name
 * Returns up to 10 matching users
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await serverClient
    .from("users")
    .select("*")
    .eq("deleted", false)
    .or(`handle.ilike.${searchTerm},name.ilike.${searchTerm}`)
    .limit(10);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return data as User[];
};

/**
 * Get all creators with optional search and tag filtering
 * Returns users with their tags
 */
export const getCreators = async (params?: {
  search?: string;
  tags?: string[];
  limit?: number;
}): Promise<{ user: User; tags: string[] }[]> => {
  const { search, tags, limit = 50 } = params || {};

  // Build the query
  let query = serverClient
    .from("users")
    .select(`
      *,
      user_tags (
        value
      )
    `)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Add search filter
  if (search && search.trim().length > 0) {
    const searchTerm = `%${search.trim()}%`;
    query = query.or(`handle.ilike.${searchTerm},name.ilike.${searchTerm},bio.ilike.${searchTerm}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching creators:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Transform the data and apply tag filtering
  const creators = data.map((row: any) => ({
    user: {
      id: row.id,
      handle: row.handle,
      email: row.email,
      name: row.name,
      bio: row.bio,
      avatar_url: row.avatar_url,
      stripe_account_id: row.stripe_account_id,
      stripe_customer_id: row.stripe_customer_id,
      stripe_connect_account_id: row.stripe_connect_account_id,
      stripe_connect_onboarded: row.stripe_connect_onboarded,
      stripe_connect_details_submitted: row.stripe_connect_details_submitted,
      stripe_connect_charges_enabled: row.stripe_connect_charges_enabled,
      stripe_connect_payouts_enabled: row.stripe_connect_payouts_enabled,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted: row.deleted,
      deleted_at: row.deleted_at,
    } as User,
    tags: row.user_tags?.map((t: any) => t.value) || [],
  }));

  // Filter by tags if specified
  if (tags && tags.length > 0) {
    return creators.filter((creator) =>
      tags.some((tag) => creator.tags.includes(tag))
    );
  }

  return creators;
};

/**
 * Get tags for a specific user
 */
export const getUserTags = async (userId: string): Promise<string[]> => {
  const { data, error } = await serverClient
    .from("user_tags")
    .select("value")
    .eq("user_id", userId)
    .eq("deleted", false);

  if (error) {
    console.error("Error fetching user tags:", error);
    return [];
  }

  return data?.map((tag) => tag.value) || [];
};

/**
 * Add a tag to a user
 */
export const addUserTag = async (
  userId: string,
  tag: string
): Promise<boolean> => {
  const { error } = await serverClient.from("user_tags").insert({
    user_id: userId,
    value: tag,
  });

  if (error) {
    console.error("Error adding user tag:", error);
    return false;
  }

  return true;
};

/**
 * Remove a tag from a user
 */
export const removeUserTag = async (
  userId: string,
  tag: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from("user_tags")
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("value", tag);

  if (error) {
    console.error("Error removing user tag:", error);
    return false;
  }

  return true;
};
