/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */

import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/data-access/notifications";

export const POST: APIRoute = async ({ cookies }) => {
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

  const userId = session.user.id;

  // Mark all as read
  const success = await markAllNotificationsAsRead(userId);

  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to mark notifications as read" }), {
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
