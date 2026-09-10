import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the current user
 */

import { getUnreadNotificationCount } from "@gameloopers/core/data-access/notifications";

export const notificationsUnreadCount: Controller = async ({ request, userId }) => {
  // Authenticate user

  if (!userId) {
    return unauthorized();
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
