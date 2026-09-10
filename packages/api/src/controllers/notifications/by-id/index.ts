import type { Controller } from '../../../context';
import { unauthorized } from '../../../responses';
/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */

import {
  deleteNotification,
  getNotificationById,
} from '@gameloopers/core/data-access/notifications';

export const notificationsId: Controller = async ({ params, userId }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Notification ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate user

  if (!userId) {
    return unauthorized();
  }

  // Verify notification belongs to user
  const notification = await getNotificationById(id);
  if (!notification || notification.user_id !== userId) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete notification
  const success = await deleteNotification(id);

  if (!success) {
    return new Response(JSON.stringify({ error: 'Failed to delete notification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
