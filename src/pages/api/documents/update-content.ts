import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import {
  updateDocumentContent,
  canUserEditDocument,
  type TipTapContent,
} from "@/lib/data-access/documents";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    console.error("Missing auth cookies in update-content:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      allCookies: Object.keys(cookies.getAll()),
    });
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
  } catch {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;

  try {
    const body = await request.json();
    const { documentId, content } = body as {
      documentId: string;
      content: TipTapContent;
    };

    if (!documentId || !content) {
      return new Response(JSON.stringify({ error: "Missing documentId or content" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permission
    const canEdit = await canUserEditDocument(documentId, userId);
    if (!canEdit) {
      return new Response(JSON.stringify({ error: "Not authorized to edit this document" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update content
    const success = await updateDocumentContent(documentId, content);

    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to save content" }), {
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
    console.error("Update content error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to save content",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
