import type { APIRoute } from "astro";
import { updateUserProfile } from "@/lib/data-access/users";
import { setSession } from "@/lib/auth";
import { uploadFile, generateFilePath } from "@/lib/storage";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
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
      return new Response(JSON.stringify({ error: "Invalid session" }), {
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
  const currentAccessToken = session.data.session?.access_token;

  if (!currentAccessToken) {
    return new Response(JSON.stringify({ error: "No valid access token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const handle = formData.get("handle")?.toString();
    const name = formData.get("name")?.toString();
    const bio = formData.get("bio")?.toString();
    let avatar_url = formData.get("avatar_url")?.toString();

    // Handle avatar file upload
    const avatarFile = formData.get("avatar") as File | null;
    if (avatarFile && avatarFile.size > 0) {
      const filePath = generateFilePath(userId, avatarFile.name);
      const uploadResult = await uploadFile({
        bucket: "user-avatars",
        path: filePath,
        file: avatarFile,
        accessToken: currentAccessToken,
      });

      if (uploadResult) {
        avatar_url = uploadResult.url;
      }
    }

    if (!handle) {
      return new Response(JSON.stringify({ error: "Handle is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedUser = await updateUserProfile(userId, {
      handle: handle || undefined,
      name: name || undefined,
      bio: bio || undefined,
      avatar_url: avatar_url || undefined,
    });

    if (!updatedUser) {
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
