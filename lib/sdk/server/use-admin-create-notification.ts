import { createClient } from "@/lib/supabase/server";

interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function useAdminCreateNotification(
  notification: NotificationData,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert(notification);

  return { data, error };
}
