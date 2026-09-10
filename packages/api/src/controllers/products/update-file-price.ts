import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { updateProductFilePrice } from '@gameloopers/core/data-access/products';
import { serverClient } from '@gameloopers/core/data-access/client';
import { z } from 'zod';

const updatePriceSchema = z.object({
  fileId: z.string().uuid(),
  priceCents: z.number().int().min(0),
});

export const productsUpdateFilePrice: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = updatePriceSchema.parse(body);

    // Verify the user owns the product this file belongs to
    const { data: file, error: fetchError } = await serverClient
      .from('product_files')
      .select('product_id, products!inner(user_id)')
      .eq('id', validatedData.fileId)
      .single();

    if (fetchError || !file) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const productUserId = (file.products as unknown as { user_id: string })?.user_id;

    if (productUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the price
    const success = await updateProductFilePrice(
      validatedData.fileId,
      validatedData.priceCents
    );

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update file price' }), {
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

    console.error('Update file price error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update file price',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
