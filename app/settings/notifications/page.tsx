import { createClient } from "@/lib/supabase/server";
import { NotificationSettingsForm } from "@/components/blocks/notification-settings-form";

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user profile with notification preferences
  const { data: profile } = await supabase
    .from("users")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  return (
    <NotificationSettingsForm
      preferences={profile?.notification_preferences || null}
    />
  );
}
