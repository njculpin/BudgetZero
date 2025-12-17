import type { APIRoute } from "astro";
import { getProductRoyalties } from "@/lib/data-access/royalties";
import { serverClient } from "@/lib/data-access/client";

export const GET: APIRoute = async ({ params }) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get product royalties
    const royalties = await getProductRoyalties(productId);

    // Fetch user information for each royalty
    const royaltiesWithUserInfo = await Promise.all(
      royalties.map(async (royalty) => {
        const { data: user } = await serverClient
          .from("users")
          .select("handle, full_name")
          .eq("id", royalty.user_id)
          .single();

        return {
          ...royalty,
          user_handle: user?.handle || "unknown",
          user_name: user?.full_name || user?.handle || "Unknown",
        };
      })
    );

    return new Response(
      JSON.stringify({ royalties: royaltiesWithUserInfo }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching royalties:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch royalties" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
