import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import { getAssetById } from "@/lib/data-access/assets";
import { getUserByHandle } from "@/lib/data-access/users";
import { createAssetRoyalty } from "@/lib/data-access/royalties";

const addRoyaltySchema = z.object({
  assetId: z.string().uuid(),
  userHandle: z.string().min(1),
  royaltyValue: z.number().int().min(0), // Flat rate in cents
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
    const validatedData = addRoyaltySchema.parse(body);

    // Verify asset ownership
    const asset = await getAssetById(validatedData.assetId);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Look up user by handle
    const contributor = await getUserByHandle(validatedData.userHandle);
    if (!contributor) {
      return new Response(
        JSON.stringify({ error: `User @${validatedData.userHandle} not found` }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create the royalty
    const royalty = await createAssetRoyalty({
      assetId: validatedData.assetId,
      userId: contributor.id,
      royaltyValue: validatedData.royaltyValue,
    });

    if (!royalty) {
      return new Response(
        JSON.stringify({ error: "Failed to create royalty" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        royalty,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Add royalty error:", error);

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
        error:
          error instanceof Error ? error.message : "Failed to add royalty",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
