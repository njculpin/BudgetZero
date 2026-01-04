import type { APIRoute } from "astro";
import { createDocument } from "@/lib/data-access/documents";
import { setSession } from "@/lib/auth";

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
    const document = await createDocument(userId);

    if (!document) {
      return new Response(JSON.stringify({ error: "Failed to create document" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if request wants JSON response (from fetch) or redirect (from form submission)
    const contentType = request.headers.get("Accept");
    const wantsJson = contentType?.includes("application/json");

    if (wantsJson) {
      // Return JSON for fetch requests
      return new Response(JSON.stringify({ success: true, document }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Redirect for form submissions
      return new Response(null, {
        status: 303,
        headers: { Location: `/documents/${document.handle}` },
      });
    }
  } catch (error) {
    console.error("Error creating document:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
