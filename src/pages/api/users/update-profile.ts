import type { APIRoute } from "astro";
import { updateUserProfile } from "@/lib/data-access/users";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  // Check authentication
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get auth tokens from cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const handle = formData.get("handle")?.toString();
  const name = formData.get("name")?.toString();
  const bio = formData.get("bio")?.toString();
  const avatar_url = formData.get("avatar_url")?.toString();

  if (!handle) {
    return new Response("Handle is required", { status: 400 });
  }

  try {
    const updatedUser = await updateUserProfile(
      currentUser.id,
      {
        handle: handle || undefined,
        name: name || undefined,
        bio: bio || undefined,
        avatar_url: avatar_url || undefined,
      },
      {
        accessToken,
        refreshToken,
      }
    );

    if (!updatedUser) {
      return new Response("Failed to update profile", { status: 500 });
    }

    // Redirect to the profile page (with new handle if it changed)
    return redirect(`/users/${updatedUser.handle}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(errorMessage, { status: 500 });
  }
};
