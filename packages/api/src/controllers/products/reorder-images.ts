import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import {
  reorderProductImages,
  getProductById,
} from '@gameloopers/core/data-access/products';
import { z } from 'zod';

const reorderSchema = z.object({
  productId: z.string().uuid(),
  imageOrders: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ),
});

export const productsReorderImages: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

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

    const success = await reorderProductImages(validatedData.imageOrders);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to reorder images' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Reorder images error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to reorder images',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
