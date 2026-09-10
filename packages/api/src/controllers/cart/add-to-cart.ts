import { z } from 'zod';
import { getOrCreateCart, addToCart } from '@gameloopers/core/data-access/cart';
import { getProductById } from '@gameloopers/core/data-access/products';
import type { Controller } from '../../context';
import { json, badRequest, unauthorized, notFound, serverError } from '../../responses';

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

/** Statuses a product must be in before anyone can buy it. */
const PURCHASABLE = new Set(['private', 'public']);

export const cartAddToCart: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const parsed = addToCartSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest('Invalid request', parsed.error.flatten());
    }
    const { productId, quantity } = parsed.data;

    const product = await getProductById(productId);
    if (!product) return notFound('Product not found');

    if (!PURCHASABLE.has(product.status)) {
      return badRequest(
        `This product cannot be purchased. Only products with status "private" or ` +
          `"public" can be added to cart. Current status: ${product.status}`
      );
    }

    const cart = await getOrCreateCart(userId);
    if (!cart) return serverError('Failed to get cart');

    const cartItem = await addToCart(cart.id, productId, quantity);
    if (!cartItem) return serverError('Failed to add product to cart');

    return json({ success: true, cartItem });
  } catch (error) {
    console.error('Add to cart error:', error);
    return serverError(
      error instanceof Error ? error.message : 'Failed to add to cart'
    );
  }
};
