import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getUserById } from "@/lib/data-access/users";
import { getConnectAccountStatus, createLoginLink } from "@/lib/payments/connect";
import { serverClient } from "@/lib/data-access/client";

export const GET: APIRoute = async ({ cookies }) => {
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
    // Get user data
    const user = await getUserById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has a Connect account
    if (!user.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({
          hasAccount: false,
          status: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get account status from Stripe
    const status = await getConnectAccountStatus(user.stripe_connect_account_id);

    // Update user record with latest status
    await serverClient
      .from('users')
      .update({
        stripe_connect_onboarded: status.onboarded,
        stripe_connect_details_submitted: status.detailsSubmitted,
        stripe_connect_charges_enabled: status.chargesEnabled,
        stripe_connect_payouts_enabled: status.payoutsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Create login link if account is onboarded
    let dashboardUrl = null;
    if (status.onboarded) {
      try {
        const loginLink = await createLoginLink(user.stripe_connect_account_id);
        dashboardUrl = loginLink.url;
      } catch (error) {
        console.error("Error creating login link:", error);
      }
    }

    return new Response(
      JSON.stringify({
        hasAccount: true,
        status,
        dashboardUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get account status error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to get account status",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
