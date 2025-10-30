import type { APIRoute } from "astro";
import { searchUsers } from "@/lib/data-access/users";

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify({ error: "Query parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const users = await searchUsers(query);

    return new Response(
      JSON.stringify({
        users: users.map((user) => ({
          id: user.id,
          handle: user.handle,
          name: user.name,
          avatar_url: user.avatar_url,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
