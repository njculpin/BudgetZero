import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
/**
 * POST /api/settings/notifications
 * Update notification settings for the current user
 */

import { updateNotificationSettings } from '@gameloopers/core/data-access/notifications';

export const settingsNotifications: Controller = async ({ request, userId }) => {
  // Authenticate user
  if (!userId) return unauthorized('Not authenticated');

  // Parse request body
  let settings;
  try {
    settings = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update settings
  const updated = await updateNotificationSettings(userId, settings);

  if (!updated) {
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, settings: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
