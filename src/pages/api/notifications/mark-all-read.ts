/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */

import type { APIRoute } from "astro";
import { requireUserId, unauthorizedResponse } from "@/lib/auth/require-user";
import { markAllNotificationsAsRead } from "@/lib/data-access/notifications";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Authenticate user
  const userId = await requireUserId(cookies);

  if (!userId) {
    return redirect("/sign-in");
  }

  // Mark all as read
  const success = await markAllNotificationsAsRead(userId);

  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to mark notifications as read" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Redirect back to notifications page
  return redirect("/notifications");
};
