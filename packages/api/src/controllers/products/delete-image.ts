import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { deleteProductImage } from '@gameloopers/core/data-access/products';
import { serverClient } from '@gameloopers/core/data-access/client';
import { z } from 'zod';

const deleteSchema = z.object({
  imageId: z.string().uuid(),
});

export const productsDeleteImage: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = deleteSchema.parse(body);

    const { data: image, error: fetchError } = await serverClient
      .from('product_images')
      .select('product_id, products!inner(user_id)')
      .eq('id', validatedData.imageId)
      .single();

    if (fetchError || !image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const productUserId = (image.products as unknown as { user_id: string })?.user_id;

    if (productUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await deleteProductImage(validatedData.imageId);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete image' }), {
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

    console.error('Delete image error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete image',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
