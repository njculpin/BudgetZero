import type { APIRoute } from "astro";
import { createAsset } from "@/lib/data-access/assets";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
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

  try {
    const asset = await createAsset(currentUser.id, {
      accessToken,
      refreshToken,
    });

    if (!asset) {
      return new Response(JSON.stringify({ error: "Failed to create asset" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/assets/${asset.handle}/edit` },
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
