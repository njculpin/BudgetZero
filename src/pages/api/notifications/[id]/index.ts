/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */

import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { deleteNotification, getNotificationById } from "@/lib/data-access/notifications";

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Notification ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authenticate user
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await getSession(
    accessToken.value,
    refreshToken.value
  );

  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify notification belongs to user
  const notification = await getNotificationById(id);
  if (!notification || notification.user_id !== session.user.id) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete notification
  const success = await deleteNotification(id);

  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to delete notification" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
