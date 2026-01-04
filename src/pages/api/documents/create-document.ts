import type { APIRoute } from "astro";
import { createDocument } from "@/lib/data-access/documents";
import { addDocumentToProduct, getProductById } from "@/lib/data-access/products";
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
    // Parse request body to check for productId and priceCents
    const contentType = request.headers.get("Content-Type");
    let productId: string | null = null;
    let priceCents: number = 0;

    if (contentType?.includes("application/json")) {
      const body = await request.json();
      productId = body.productId || null;
      priceCents = body.priceCents || 0;
    }

    // Create the document
    const document = await createDocument(userId);

    if (!document) {
      return new Response(JSON.stringify({ error: "Failed to create document" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If productId is provided, auto-attach the document to the product
    if (productId) {
      // Check product ownership
      const product = await getProductById(productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (product.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Attach document to product
      const productDocument = await addDocumentToProduct(
        productId,
        document.id,
        priceCents
      );

      if (!productDocument) {
        return new Response(
          JSON.stringify({ error: "Document created but failed to attach to product" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Return the product document record
      return new Response(
        JSON.stringify({ success: true, document, productDocument }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if request wants JSON response (from fetch) or redirect (from form submission)
    const acceptHeader = request.headers.get("Accept");
    const wantsJson = acceptHeader?.includes("application/json");

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
