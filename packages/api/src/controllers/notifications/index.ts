import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */

import { getNotifications } from "@gameloopers/core/data-access/notifications";

export const notifications: Controller = async ({ request, url, userId, params }) => {
  // Authenticate user

  if (!userId) {
    return unauthorized();
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
