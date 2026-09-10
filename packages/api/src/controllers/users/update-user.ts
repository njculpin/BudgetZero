import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { updateUserProfile } from "@gameloopers/core/data-access/users";
import { uploadFile, generateFilePath } from "@gameloopers/core/storage";

export const usersUpdateUser: Controller = async ({ request, userId, accessToken }) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');
  
  if (!accessToken) {
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
        accessToken: accessToken ?? undefined,
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
