import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import {
  updateDocumentContent,
  canUserEditDocument,
  type TipTapContent,
} from '@gameloopers/core/data-access/documents';

export const documentsUpdateContent: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const { documentId, content } = body as {
      documentId: string;
      content: TipTapContent;
    };

    if (!documentId || !content) {
      return new Response(JSON.stringify({ error: 'Missing documentId or content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    const canEdit = await canUserEditDocument(documentId, userId);
    if (!canEdit) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to edit this document' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update content
    const success = await updateDocumentContent(documentId, content);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to save content' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trigger PDF regeneration for all published products using this document
    try {
      // Import here to avoid circular dependency issues
      // TODO: Move to data access layer
      const { serverClient } = await import('@gameloopers/core/data-access/client');

      // Find all published products that use this document
      const { data: productDocs } = await serverClient
        .from('product_documents')
        .select('product_id, products!inner(status)')
        .eq('document_id', documentId)
        .eq('deleted', false)
        .eq('products.status', 'public')
        .eq('products.deleted', false);

      // Trigger PDF regeneration for each product
      if (productDocs && productDocs.length > 0) {
        for (const productDoc of productDocs) {
          const pdfFormData = new FormData();
          pdfFormData.append('productId', productDoc.product_id);

          // Fire and forget - don't wait for PDF generation
          fetch(new URL('/api/products/generate-document-pdfs', request.url), {
            method: 'POST',
            headers: {
              Cookie: request.headers.get('Cookie') || '',
            },
            body: pdfFormData,
          }).catch((error) => {
            console.error(
              `Failed to trigger PDF regeneration for product ${productDoc.product_id}:`,
              error
            );
          });
        }
      }
    } catch (error) {
      console.error('Failed to check for PDF regeneration:', error);
      // Don't fail the content update if PDF regeneration fails
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update content error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to save content',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
