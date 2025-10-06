import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Update privacy settings in profile
    const { error } = await supabase
      .from("profiles")
      .update({
        is_profile_public: data.is_profile_public,
        show_email_public: data.show_email_public,
        allow_collaboration_requests: data.allow_collaboration_requests,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update privacy settings",
      },
      { status: 500 }
    );
  }
}
