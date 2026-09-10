import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { removeFromCart } from '@gameloopers/core/data-access/cart';
import { z } from 'zod';

const removeCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
});

export const cartRemove: Controller = async ({ request, userId }) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = removeCartItemSchema.parse(body);

    const success = await removeFromCart(validatedData.cartItemId);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to remove cart item' }), {
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

    console.error('Remove cart item error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to remove cart item',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
