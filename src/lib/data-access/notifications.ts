/**
 * Notification Data Access Layer
 *
 * Handles all database operations for notifications and notification settings.
 * Isolated from direct Supabase SDK usage - all queries go through this layer.
 */

import { createClient } from "../database/client";
import type { Notification, NotificationSettings } from "@/types";

/**
 * Get all notifications for a user
 */
export async function getNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Notification[]> {
  const client = await createClient();

  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(
  userId: string
): Promise<Notification[]> {
  const client = await createClient();

  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("read", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const client = await createClient();

  const { count, error } = await client
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)
    .eq("deleted", false);

  if (error) {
    console.error("Error counting unread notifications:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(
  id: string
): Promise<Notification | null> {
  const client = await createClient();

  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (error) {
    console.error("Error fetching notification:", error);
    return null;
  }

  return data;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const client = await createClient();

  const { error } = await client
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  const client = await createClient();

  const { error } = await client
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }

  return true;
}

/**
 * Soft delete a notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  const client = await createClient();

  const { error } = await client
    .from("notifications")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error deleting notification:", error);
    return false;
  }

  return true;
}

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const client = await createClient();

  const { data, error } = await client
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no settings exist, return default settings
    if (error.code === "PGRST116") {
      return createDefaultNotificationSettings(userId);
    }
    console.error("Error fetching notification settings:", error);
    return null;
  }

  return data;
}

/**
 * Create default notification settings for a user
 */
async function createDefaultNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const client = await createClient();

  const { data, error } = await client
    .from("notification_settings")
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating default notification settings:", error);
    return null;
  }

  return data;
}

/**
 * Update notification settings for a user
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<Omit<NotificationSettings, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<NotificationSettings | null> {
  const client = await createClient();

  const { data, error } = await client
    .from("notification_settings")
    .update(settings)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating notification settings:", error);
    return null;
  }

  return data;
}

/**
 * Resolve a product conflict (mark as reviewed and clear attention flags)
 */
export async function resolveProductConflict(
  productId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const client = await createClient();

  const { data, error } = await client.rpc("resolve_product_conflict", {
    p_product_id: productId,
    p_user_id: userId,
  });

  if (error) {
    console.error("Error resolving product conflict:", error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; error?: string };
}

/**
 * Get products that need attention for a user
 */
export async function getProductsNeedingAttention(
  userId: string
): Promise<Array<{
  id: string;
  title: string;
  handle: string;
  attention_reason: string;
  attention_since: string;
}>> {
  const client = await createClient();

  const { data, error } = await client
    .from("products")
    .select("id, title, handle, attention_reason, attention_since")
    .eq("user_id", userId)
    .eq("needs_attention", true)
    .eq("deleted", false)
    .order("attention_since", { ascending: false });

  if (error) {
    console.error("Error fetching products needing attention:", error);
    return [];
  }

  return data || [];
}
