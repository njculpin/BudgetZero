import { serverClient } from "./client";
import type { User } from "@/types";

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
