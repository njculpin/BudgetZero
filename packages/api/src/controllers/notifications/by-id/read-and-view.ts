import { redirect } from '../../../responses';
import type { Controller } from '../../../context';
/**
 * POST /api/notifications/[id]/read-and-view
 * Mark a notification as read and redirect to the entity
 */

import {
  markNotificationAsRead,
  getNotificationById,
} from '@gameloopers/core/data-access/notifications';

export const notificationsIdReadAndView: Controller = async ({
  request,
  params,
  userId,
}) => {
  const { id } = params;

  if (!id) {
    return redirect('/notifications');
  }

  // Authenticate user

  if (!userId) {
    return redirect('/sign-in');
  }

  // Verify notification belongs to user
  const notification = await getNotificationById(id);
  if (!notification || notification.user_id !== userId) {
    return redirect('/notifications');
  }

  // Mark as read
  await markNotificationAsRead(id);

  // Get redirect URL from form data
  const formData = await request.formData();
  const entityUrl = formData.get('entityUrl') as string;

  if (entityUrl) {
    return redirect(entityUrl);
  }

  // Fallback to notifications page
  return redirect('/notifications');
};
