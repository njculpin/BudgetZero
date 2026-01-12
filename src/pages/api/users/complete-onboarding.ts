import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { completeOnboarding } from "@/lib/data-access/users";

export const POST: APIRoute = async ({ cookies, request }) => {
  // Verify user is authenticated
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { data, error } = await setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

    if (error || !data.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = data;

    // Mark user's onboarding as completed
    const updatedUser = await completeOnboarding(session.user.id);

    if (!updatedUser) {
      return new Response(
        JSON.stringify({ error: "Failed to complete onboarding" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in complete-onboarding:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
