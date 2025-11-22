import type { APIRoute } from "astro";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { setSession } from "@/lib/auth";
import { getDocumentById, getDocumentContent } from "@/lib/data-access/documents";
import { createAsset, createAssetFile } from "@/lib/data-access/assets";
import { serverClient } from "@/lib/data-access/client";

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: Array<{ type: string }>;
  attrs?: Record<string, unknown>;
}

// Convert TipTap JSON to plain text with basic formatting info
function extractTextFromTipTap(node: TipTapNode, depth = 0): string {
  let result = "";

  if (node.text) {
    result += node.text;
  }

  if (node.content) {
    for (const child of node.content) {
      const childText = extractTextFromTipTap(child, depth + 1);

      switch (child.type) {
        case "heading":
          const level = (child.attrs?.level as number) || 1;
          result += "\n" + "#".repeat(level) + " " + childText + "\n\n";
          break;
        case "paragraph":
          result += childText + "\n\n";
          break;
        case "bulletList":
        case "orderedList":
          result += childText + "\n";
          break;
        case "listItem":
          result += "• " + childText + "\n";
          break;
        case "blockquote":
          result += "> " + childText + "\n\n";
          break;
        case "codeBlock":
          result += "```\n" + childText + "\n```\n\n";
          break;
        case "horizontalRule":
          result += "\n---\n\n";
          break;
        default:
          result += childText;
      }
    }
  }

  return result;
}

// Generate PDF from document content
async function generatePDF(title: string, content: TipTapNode): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 72; // 1 inch margins
  const lineHeight = 14;
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Helper to add new page if needed
  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // Draw title
  const titleSize = 24;
  ensureSpace(titleSize + 20);
  page.drawText(title, {
    x: margin,
    y: y - titleSize,
    size: titleSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= titleSize + 30;

  // Process content
  const text = extractTextFromTipTap(content);
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) {
      y -= lineHeight / 2;
      continue;
    }

    // Check for headings
    const headingMatch = line.match(/^(#+)\s(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const size = Math.max(18 - (level - 1) * 2, 12);

      ensureSpace(size + 10);
      page.drawText(headingText, {
        x: margin,
        y: y - size,
        size,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= size + 15;
      continue;
    }

    // Check for blockquotes
    if (line.startsWith("> ")) {
      const quoteText = line.substring(2);
      ensureSpace(lineHeight + 5);
      page.drawText(quoteText, {
        x: margin + 20,
        y: y - 12,
        size: 11,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= lineHeight + 5;
      continue;
    }

    // Regular text - word wrap
    const words = line.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, 12);

      if (textWidth > maxWidth && currentLine) {
        ensureSpace(lineHeight);
        page.drawText(currentLine, {
          x: margin,
          y: y - 12,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      ensureSpace(lineHeight);
      page.drawText(currentLine, {
        x: margin,
        y: y - 12,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }
  }

  return pdfDoc.save();
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let currentUser = null;
  try {
    const session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });
    if (!session.error && session.data.user) {
      currentUser = session.data.user;
    }
  } catch {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get request data
  const { documentId } = await request.json();

  if (!documentId) {
    return new Response(JSON.stringify({ error: "Document ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch document
  const document = await getDocumentById(documentId);
  if (!document) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check ownership
  if (document.user_id !== currentUser.id) {
    return new Response(JSON.stringify({ error: "Only the document owner can create assets" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get document content
  const content = await getDocumentContent(documentId);
  if (!content) {
    return new Response(JSON.stringify({ error: "Document has no content" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Generate PDF
    const pdfBytes = await generatePDF(document.title, content as TipTapNode);

    // Create asset
    const asset = await createAsset(currentUser.id);
    if (!asset) {
      return new Response(JSON.stringify({ error: "Failed to create asset" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update asset title and description
    await serverClient
      .from("assets")
      .update({
        title: document.title,
        description: document.description || `Generated from document: ${document.title}`,
      })
      .eq("id", asset.id);

    // Upload PDF to storage
    const fileName = `${asset.id}/${document.handle}.pdf`;
    const { error: uploadError } = await serverClient.storage
      .from("asset-files")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload PDF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = serverClient.storage
      .from("asset-files")
      .getPublicUrl(fileName);

    // Add file record to asset
    const assetFile = await createAssetFile(asset.id, {
      title: `${document.title}.pdf`,
      description: "PDF generated from document",
      file_url: urlData.publicUrl,
      storage_path: fileName,
      file_size_bytes: pdfBytes.length,
      mime_type: "application/pdf",
    });

    if (!assetFile) {
      return new Response(JSON.stringify({ error: "Failed to create asset file record" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get updated asset with handle
    const { data: updatedAsset } = await serverClient
      .from("assets")
      .select("*")
      .eq("id", asset.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        asset: updatedAsset,
        message: "Asset created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating asset from document:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create asset from document" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
