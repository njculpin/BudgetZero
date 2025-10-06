import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <ProfileSettingsForm user={user} profile={profile} />;
}
