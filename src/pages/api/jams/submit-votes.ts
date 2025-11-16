import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { serverClient } from "@/lib/data-access/client";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
    const { jam_id, votes } = body as {
      jam_id: string;
      votes: Array<{ category_id: string; product_id: string }>;
    };

    if (!jam_id || !Array.isArray(votes)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: jam } = await serverClient
      .from("jams")
      .select("end_date, voting_end_date")
      .eq("id", jam_id)
      .eq("deleted", false)
      .single();

    if (!jam || !jam.voting_end_date) {
      return new Response(
        JSON.stringify({ error: "Jam not found or voting not configured" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const endDate = new Date(jam.end_date);
    const votingEndDate = new Date(jam.voting_end_date);

    if (now <= endDate || now > votingEndDate) {
      return new Response(
        JSON.stringify({ error: "Voting window is closed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { error: deleteError } = await serverClient
      .from("jam_votes")
      .delete()
      .eq("jam_id", jam_id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting existing votes:", deleteError);
    }

    if (votes.length > 0) {
      const voteRecords = votes.map((vote) => ({
        jam_id,
        category_id: vote.category_id,
        product_id: vote.product_id,
        user_id: userId,
        submitted_at: new Date().toISOString(),
      }));

      const { error: insertError } = await serverClient
        .from("jam_votes")
        .insert(voteRecords);

      if (insertError) {
        console.error("Vote insertion error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to submit votes" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Vote submission error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
