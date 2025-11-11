import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import { updateAssetRoyalty, getRoyaltyById } from "@/lib/data-access/royalties";
import { serverClient } from "@/lib/data-access/client";

const updateRoyaltySchema = z.object({
  royaltyId: z.string().uuid(),
  royaltyValue: z.number().int().min(0),
});

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const body = await request.json();
    const validatedData = updateRoyaltySchema.parse(body);

    // Get the royalty to verify ownership through asset
    const royalty = await getRoyaltyById(validatedData.royaltyId);
    if (!royalty) {
      return new Response(JSON.stringify({ error: "Royalty not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user owns the asset
    const { data: asset, error: assetError } = await serverClient
      .from("assets")
      .select("user_id")
      .eq("id", royalty.asset_id)
      .single();

    if (assetError || !asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the royalty
    const success = await updateAssetRoyalty(
      validatedData.royaltyId,
      validatedData.royaltyValue
    );

    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to update royalty" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update royalty error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update royalty",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
