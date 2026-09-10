import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { updateCartItemQuantity } from '@gameloopers/core/data-access/cart';
import { z } from 'zod';

const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0), // 0 or less will remove the item
});

export const cartUpdate: Controller = async ({ request, userId }) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = updateCartItemSchema.parse(body);

    const success = await updateCartItemQuantity(
      validatedData.cartItemId,
      validatedData.quantity
    );

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update cart item' }), {
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

    console.error('Update cart item error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update cart item',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
