import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
/**
 * GET /api/products/embedded-usage
 *
 * Lists the products that embed the caller's components, and what the caller has
 * earned from each.
 */

import { getEmbeddedUsageForUser } from '@gameloopers/core/data-access/products';

export const productsEmbeddedUsage: Controller = async ({ userId }) => {
  // Earnings are private financial data. This previously read the user id straight
  // from a query parameter, which let anyone read anyone else's royalty income — so
  // the caller is now always the session user.

  if (!userId) {
    return unauthorized();
  }

  try {
    const parentProducts = await getEmbeddedUsageForUser(userId);

    return new Response(JSON.stringify({ parentProducts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in embedded-usage:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
