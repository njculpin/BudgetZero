/**
 * POST /api/settings/notifications
 * Update notification settings for the current user
 */

import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { updateNotificationSettings } from "@/lib/data-access/notifications";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Authenticate user
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;

  // Parse request body
  let settings;
  try {
    settings = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update settings
  const updated = await updateNotificationSettings(userId, settings);

  if (!updated) {
    return new Response(JSON.stringify({ error: "Failed to update settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, settings: updated }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
