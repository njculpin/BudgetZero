import type { Controller } from '../../../context';
import { unauthorized } from '../../../responses';
/**
 * POST /api/products/[productId]/resolve-conflict
 * Mark a product conflict as resolved
 */

import { resolveProductConflict } from '@gameloopers/core/data-access/notifications';

export const productsProductIdResolveConflict: Controller = async ({
  params,
  userId,
}) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: 'Product ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate user
  if (!userId) return unauthorized('Not authenticated');

  // Resolve conflict
  const result = await resolveProductConflict(productId, userId);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error || 'Failed to resolve conflict' }),
      {
        status: result.error === 'Unauthorized' ? 403 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
