import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import {
  getDocumentById,
  canUserEditDocument,
  createDocumentAttachment,
} from "@/lib/data-access/documents";
import { uploadFile, generateFilePath } from "@/lib/storage";

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
    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const files = formData.getAll("files") as File[];

    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
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

    // Upload each file
    const uploadedAttachments = [];
    for (const file of files) {
      // Generate file path
      const filePath = generateFilePath(
        userId,
        file.name,
        `documents/${documentId}/attachments`
      );

      // Upload to storage
      const uploadResult = await uploadFile({
        bucket: "asset-files",
        path: filePath,
        file,
        accessToken: accessToken.value,
      });

      if (!uploadResult) {
        console.error("File upload failed for:", file.name);
        continue; // Skip this file but continue with others
      }

      // Create database record
      const attachment = await createDocumentAttachment(documentId, {
        title: file.name,
        description: "",
        file_url: uploadResult.url,
        storage_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
      });

      if (attachment) {
        uploadedAttachments.push(attachment);
      }
    }

    if (uploadedAttachments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to upload any files" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        attachments: uploadedAttachments,
        message: `Successfully uploaded ${uploadedAttachments.length} file(s)`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload attachments error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to upload files",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
