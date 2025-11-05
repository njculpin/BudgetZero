import type { APIRoute } from "astro";
import { createJam } from "@/lib/data-access/jams";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const jam = await createJam(currentUser.id);

    if (!jam) {
      return new Response(
        JSON.stringify({ error: "Failed to create jam" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/jams/${jam.handle}` },
    });
  } catch (error) {
    console.error("Error creating jam:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
