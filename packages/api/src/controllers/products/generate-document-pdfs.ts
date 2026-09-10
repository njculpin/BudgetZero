import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import {
  getProductById,
  getProductDocuments,
} from '@gameloopers/core/data-access/products';
import {
  getDocumentById,
  getDocumentContent,
} from '@gameloopers/core/data-access/documents';
import { serverClient } from '@gameloopers/core/data-access/client';

/**
 * Generate PDFs for all documents attached to a product
 * Called when a product is published or when document content is updated
 */
export const productsGenerateDocumentPdfs: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const formData = await request.formData();
    const productId = formData.get('productId') as string;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    const product = await getProductById(productId);
    if (!product || product.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all documents attached to this product
    const productDocuments = await getProductDocuments(productId);

    if (productDocuments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No documents to generate PDFs for' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const generatedPDFs = [];

    // Generate PDF for each document
    for (const productDoc of productDocuments) {
      const document = await getDocumentById(productDoc.document_id);
      if (!document) continue;

      const content = await getDocumentContent(productDoc.document_id);
      if (!content) continue;

      // TODO: Implement actual PDF generation
      // For now, we'll just update the record to indicate PDF generation is pending
      // In production, this would:
      // 1. Convert TipTap JSON to HTML
      // 2. Use Puppeteer/Playwright to render HTML to PDF
      // 3. Upload PDF to Supabase Storage
      // 4. Update product_documents with PDF URL

      // Placeholder: Mark as PDF generation pending
      const storagePath = `products/${productId}/documents/${document.id}-${document.handle}.pdf`;

      // Update product_document with placeholder (will be replaced with actual PDF URL)
      const { error: updateError } = await serverClient
        .from('product_documents')
        .update({
          pdf_storage_path: storagePath,
          pdf_generated_at: new Date().toISOString(),
          // pdf_url will be set after actual PDF upload
        })
        .eq('id', productDoc.id);

      if (updateError) {
        console.error(`Failed to update product_document ${productDoc.id}:`, updateError);
        continue;
      }

      generatedPDFs.push({
        documentId: document.id,
        documentTitle: document.title,
        storagePath,
        status: 'pending', // In production: "success" after actual generation
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `PDF generation queued for ${generatedPDFs.length} document(s)`,
        pdfs: generatedPDFs,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Generate PDFs error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate PDFs',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
