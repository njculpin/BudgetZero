import type { APIRoute } from "astro";
import { getAllTags } from "@/lib/data-access/tags";

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get("q")?.toLowerCase() || "";

    // Fetch all tags
    const allTags = await getAllTags();

    // Filter tags by query if provided
    const filteredTags = query
      ? allTags.filter((tag) =>
          tag.value.toLowerCase().includes(query)
        )
      : allTags;

    // Return top 10 suggestions, sorted by count
    const suggestions = filteredTags
      .slice(0, 10)
      .map((tag) => ({
        value: tag.value,
        count: tag.count,
      }));

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching tag suggestions:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch suggestions",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
