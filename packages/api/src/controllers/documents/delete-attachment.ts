import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import {
  getDocumentById,
  canUserEditDocument,
  deleteDocumentAttachment,
} from "@gameloopers/core/data-access/documents";

export const documentsDeleteAttachment: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const formData = await request.formData();
    const attachmentId = formData.get("attachmentId") as string;
    const documentId = formData.get("documentId") as string;

    if (!attachmentId) {
      return new Response(JSON.stringify({ error: "Attachment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check document access
    const document = await getDocumentById(documentId);
    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const canEdit = await canUserEditDocument(documentId, userId);
    if (!canEdit) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the attachment
    const success = await deleteDocumentAttachment(attachmentId);

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to delete attachment" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Attachment deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Delete attachment error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to delete attachment",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
