/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */

import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { getNotifications } from "@/lib/data-access/notifications";

export const GET: APIRoute = async ({ cookies, url }) => {
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

  // Get pagination params
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  // Fetch notifications
  const notifications = await getNotifications(userId, limit, offset);

  return new Response(
    JSON.stringify({
      notifications,
      count: notifications.length,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
