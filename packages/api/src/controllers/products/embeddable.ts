import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
/**
 * GET /api/products/embeddable
 * Fetches products that can be embedded as components
 */

import { getEmbeddableProducts } from '@gameloopers/core/data-access/products';

export const productsEmbeddable: Controller = async ({ userId }) => {
  // Authenticate user

  if (!userId) {
    return unauthorized();
  }

  // Fetch embeddable products for this user
  const products = await getEmbeddableProducts(userId);

  return new Response(
    JSON.stringify({
      products,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
