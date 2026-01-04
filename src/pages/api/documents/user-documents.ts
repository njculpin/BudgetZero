import type { APIRoute } from "astro";
import { serverClient } from "@/lib/data-access/client";

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  const limit = parseInt(url.searchParams.get("limit") || "3", 10);

  if (!userId) {
    return new Response(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data, error } = await serverClient
      .from("documents")
      .select("id, handle, title, description")
      .eq("user_id", userId)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching user documents:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch documents" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ documents: data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in user-documents API:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch documents",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
