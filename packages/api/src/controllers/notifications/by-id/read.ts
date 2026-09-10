import type { Controller } from '../../../context';
import { redirect, unauthorized } from '../../../responses';
/**
 * POST /api/notifications/[id]/read
 * Mark a notification as read
 */

import { markNotificationAsRead, getNotificationById } from "@gameloopers/core/data-access/notifications";

export const notificationsIdRead: Controller = async ({ request, params, userId }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Notification ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authenticate user

  if (!userId) {
    return unauthorized();
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
