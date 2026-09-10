import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import {
  addDocumentToProduct,
  getProductById,
} from '@gameloopers/core/data-access/products';
import { z } from 'zod';

const addDocumentSchema = z.object({
  productId: z.string().uuid(),
  documentId: z.string().uuid(),
  priceCents: z.number().int().min(0).default(0),
});

export const productsAddDocument: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const productId = body.productId;
    const documentId = body.documentId;
    const priceCents = body.priceCents;

    const validatedData = addDocumentSchema.parse({
      productId,
      documentId,
      priceCents,
    });

    // Check product ownership
    const product = await getProductById(validatedData.productId);
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (product.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add document to product
    const productDocument = await addDocumentToProduct(
      validatedData.productId,
      validatedData.documentId,
      validatedData.priceCents
    );

    if (!productDocument) {
      return new Response(
        JSON.stringify({ error: 'Failed to add document to product' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, productDocument }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Add document error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to add document',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
