import type { APIRoute } from "astro";
import { updateUserProfile } from "@/lib/data-access/users";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  // Check authentication
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get auth tokens from cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await request.formData();
  const handle = formData.get("handle")?.toString();
  const name = formData.get("name")?.toString();
  const bio = formData.get("bio")?.toString();
  const avatar_url = formData.get("avatar_url")?.toString();

  if (!handle) {
    return new Response(JSON.stringify({ error: "Handle is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success with redirect URL
    return new Response(
      JSON.stringify({ redirect: `/users/${updatedUser.handle}` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
