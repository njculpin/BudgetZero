import { redirect } from '../../responses';
import type { Controller } from '../../context';
/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */

import { markAllNotificationsAsRead } from "@gameloopers/core/data-access/notifications";

export const notificationsMarkAllRead: Controller = async ({ userId }) => {
  // Authenticate user

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
