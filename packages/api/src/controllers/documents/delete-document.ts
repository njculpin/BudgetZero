import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { deleteDocument, getDocumentById } from "@gameloopers/core/data-access/documents";

export const documentsDeleteDocument: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;

    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify ownership - only owner can delete
    const document = await getDocumentById(documentId);
    if (!document || document.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized to delete this document" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const success = await deleteDocument(documentId);

    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete document" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to delete document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
