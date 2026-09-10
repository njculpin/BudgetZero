import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { z } from "zod";
import {
  updateDocument,
  canUserEditDocument,
} from "@gameloopers/core/data-access/documents";

const updateDocumentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

export const documentsUpdateDocument: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    // Validate input
    const validatedData = updateDocumentSchema.parse({
      documentId,
      title,
      description,
    });

    // Check permission
    const canEdit = await canUserEditDocument(documentId, userId);
    if (!canEdit) {
      return new Response(JSON.stringify({ error: "Not authorized to edit this document" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update document
    const updatedDocument = await updateDocument(documentId, {
      title: validatedData.title,
      description: validatedData.description,
    });

    if (!updatedDocument) {
      return new Response(JSON.stringify({ error: "Failed to update document" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        document: updatedDocument,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update document error:", error);

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
        error: error instanceof Error ? error.message : "Failed to update document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
