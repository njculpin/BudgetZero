import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getUserById } from "@/lib/data-access/users";
import { createConnectAccount, createAccountLink } from "@/lib/payments/connect";
import { serverClient } from "@/lib/data-access/client";

export const POST: APIRoute = async ({ request, cookies, url }) => {
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

    const origin = url.origin;
    const refreshUrl = `${origin}/connect/onboarding`;
    const returnUrl = `${origin}/connect/dashboard`;

    let stripeAccountId = user.stripe_connect_account_id;

    // Create Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email: user.email,
        country: 'US', // TODO: Make this configurable
      });

      stripeAccountId = account.id;

      // Save account ID to user record
      await serverClient
        .from('users')
        .update({
          stripe_connect_account_id: stripeAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // Create account link for onboarding
    const accountLink = await createAccountLink(
      stripeAccountId,
      refreshUrl,
      returnUrl
    );

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId: stripeAccountId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create account link error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create account link",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
