/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the current user
 */

import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/data-access/notifications";

export const GET: APIRoute = async ({ cookies }) => {
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

  // Get unread count
  const count = await getUnreadNotificationCount(userId);

  return new Response(
    JSON.stringify({ count }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
