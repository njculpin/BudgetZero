import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
/**
 * POST /api/products/embed-product
 *
 * Embed one product as a component of another. The embedded product's creator
 * earns a royalty on every sale of the parent.
 */

import { z } from 'zod';
import { embedProduct } from '@gameloopers/core/data-access/products';
import { captureError } from '@gameloopers/core/monitoring';

/**
 * `inheritedPriceCents` is deliberately NOT accepted. It used to be, which meant
 * the party doing the embedding set the price of someone else's work — and the
 * schema's `min(0)` let them set it to zero. The price now comes from the child
 * creator's own configured rate, server-side.
 */
const embedSchema = z.object({
  parentProductId: z.string().uuid(),
  childProductId: z.string().uuid(),
});

/** Postgres SQLSTATEs raised by embed_product, mapped to HTTP. */
const ERROR_STATUS: Record<string, number> = {
  P0001: 400, // invalid request: self-embed, cycle, duplicate, not embeddable
  P0002: 404, // product not found
  P0003: 403, // not permitted
};

export const productsEmbedProduct: Controller = async ({ request, userId }) => {
  if (!userId) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { parentProductId, childProductId } = embedSchema.parse(body);

    const result = await embedProduct(parentProductId, childProductId, userId);

    return new Response(
      JSON.stringify({
        success: true,
        component: {
          id: result.componentId,
          parent_product_id: parentProductId,
          child_product_id: childProductId,
          inherited_price_cents: result.inheritedPriceCents,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // embed_product raises with a specific SQLSTATE and a message written for the
    // person embedding, so surface it rather than replacing it with a generic one.
    const message = error instanceof Error ? error.message : 'Failed to embed product';
    const code = (error as { code?: string })?.code;
    const status: number = (code ? ERROR_STATUS[code] : undefined) ?? 400;

    if (status >= 500) {
      captureError(error, { operation: 'products.embed', userId });
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
