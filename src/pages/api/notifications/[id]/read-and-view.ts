/**
 * POST /api/notifications/[id]/read-and-view
 * Mark a notification as read and redirect to the entity
 */

import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { markNotificationAsRead, getNotificationById } from "@/lib/data-access/notifications";

export const POST: APIRoute = async ({ params, cookies, redirect, request }) => {
  const { id } = params;

  if (!id) {
    return redirect("/notifications");
  }

  // Authenticate user
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return redirect("/sign-in");
  }

  const session = await getSession(
    accessToken.value,
    refreshToken.value
  );

  if (!session || !session.user) {
    return redirect("/sign-in");
  }

  // Verify notification belongs to user
  const notification = await getNotificationById(id);
  if (!notification || notification.user_id !== session.user.id) {
    return redirect("/notifications");
  }

  // Mark as read
  await markNotificationAsRead(id);

  // Get redirect URL from form data
  const formData = await request.formData();
  const entityUrl = formData.get("entityUrl") as string;

  if (entityUrl) {
    return redirect(entityUrl);
  }

  // Fallback to notifications page
  return redirect("/notifications");
};
