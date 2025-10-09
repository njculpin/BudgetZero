import { createClient } from "@/lib/supabase/server";
import { PrivacySettingsForm } from "@/components/blocks/privacy-settings-form";

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user profile with privacy settings
  const { data: profile } = await supabase
    .from("users")
    .select("is_profile_public, show_email_public, allow_collaboration_requests")
    .eq("id", user.id)
    .single();

  return <PrivacySettingsForm profile={profile} />;
}
