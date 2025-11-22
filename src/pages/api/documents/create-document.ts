import type { APIRoute } from "astro";
import { createDocument } from "@/lib/data-access/documents";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const document = await createDocument(currentUser.id);

    if (!document) {
      return new Response(JSON.stringify({ error: "Failed to create document" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/documents/${document.handle}` },
    });
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
