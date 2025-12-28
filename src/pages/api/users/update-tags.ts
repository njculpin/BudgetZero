import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { addUserTag, removeUserTag, getUserTags } from "@/lib/data-access/users";

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

  try {
    const formData = await request.formData();
    const tagsJson = formData.get("tags") as string;

    if (!tagsJson) {
      return new Response(JSON.stringify({ error: "Missing tags data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newTags = JSON.parse(tagsJson) as string[];

    // Get current tags
    const currentTags = await getUserTags(userId);

    // Determine tags to add and remove
    const tagsToAdd = newTags.filter((tag) => !currentTags.includes(tag));
    const tagsToRemove = currentTags.filter((tag) => !newTags.includes(tag));

    // Add new tags
    for (const tag of tagsToAdd) {
      await addUserTag(userId, tag);
    }

    // Remove old tags
    for (const tag of tagsToRemove) {
      await removeUserTag(userId, tag);
    }

    // Get updated tags
    const updatedTags = await getUserTags(userId);

    return new Response(
      JSON.stringify({ success: true, tags: updatedTags }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update tags error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update tags",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
