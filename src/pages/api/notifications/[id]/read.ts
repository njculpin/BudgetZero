/**
 * POST /api/notifications/[id]/read
 * Mark a notification as read
 */

import type { APIRoute } from "astro";
import { requireUserId, unauthorizedResponse } from "@/lib/auth/require-user";
import { markNotificationAsRead, getNotificationById } from "@/lib/data-access/notifications";

export const POST: APIRoute = async ({ params, cookies, redirect }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Notification ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authenticate user
  const userId = await requireUserId(cookies);

  if (!userId) {
    return unauthorizedResponse();
  }

  // Verify notification belongs to user
  const notification = await getNotificationById(id);
  if (!notification || notification.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mark as read
  const success = await markNotificationAsRead(id);

  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to mark notification as read" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Redirect back to notifications page
  return redirect("/notifications");
};
