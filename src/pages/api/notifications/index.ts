/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */

import type { APIRoute } from "astro";
import { requireUserId, unauthorizedResponse } from "@/lib/auth/require-user";
import { getNotifications } from "@/lib/data-access/notifications";

export const GET: APIRoute = async ({ cookies, url }) => {
  // Authenticate user
  const userId = await requireUserId(cookies);

  if (!userId) {
    return unauthorizedResponse();
  }

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
