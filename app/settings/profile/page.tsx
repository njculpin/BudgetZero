import { ProfileSettingsForm } from "@/components/blocks/profile-settings-form";
import { createClient } from "@/lib/supabase/server";

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
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return <ProfileSettingsForm user={user} profile={profile} />;
}
