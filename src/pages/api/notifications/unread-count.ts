/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the current user
 */

import type { APIRoute } from "astro";
import { requireUserId, unauthorizedResponse } from "@/lib/auth/require-user";
import { getUnreadNotificationCount } from "@/lib/data-access/notifications";

export const GET: APIRoute = async ({ cookies }) => {
  // Authenticate user
  const userId = await requireUserId(cookies);

  if (!userId) {
    return unauthorizedResponse();
  }

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
