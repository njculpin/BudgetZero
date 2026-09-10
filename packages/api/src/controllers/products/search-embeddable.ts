import type { Controller } from '../../context';
import { serverClient } from '@gameloopers/core/data-access/client';

interface ProductWithUser {
  id: string;
  title: string;
  handle: string;
  status: string;
  user_id: string;
  users: {
    name: string;
    handle: string;
  } | null;
}

export const productsSearchEmbeddable: Controller = async ({ userId, url }) => {
  const query = url.searchParams.get('q');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!query || query.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Search query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Search for products that are:
    // 1. Embeddable (is_embeddable = true)
    // 2. Public OR owned by the user
    // 3. Match the search query (title or handle)
    // 4. Not deleted
    // TODO: Move to data access layer
    const { data: rawProducts, error } = await serverClient
      .from('products')
      .select(
        `
        id,
        title,
        handle,
        status,
        user_id,
        users (
          name,
          handle
        )
      `
      )
      .eq('deleted', false)
      .eq('is_embeddable', true)
      // `userId` is the authenticated caller, from the gateway. It was
      // previously read from a query parameter and interpolated here, so any
      // caller could substitute another user's id and see that user's
      // non-public embeddable products. This query runs under the service role,
      // so row-level security does not catch it.
      .or(`status.eq.public,user_id.eq.${userId}`)
      .or(`title.ilike.%${query}%,handle.ilike.%${query}%`)
      .limit(20);

    const products = rawProducts as ProductWithUser[] | null;

    if (error) {
      console.error('Error searching products:', error);
      return new Response(JSON.stringify({ error: 'Failed to search products' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ products: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get file counts for each product
    const productIds = products.map((p) => p.id);
    const { data: fileCounts } = await serverClient
      .from('product_files')
      .select('product_id')
      .in('product_id', productIds)
      .eq('deleted', false);

    const fileCountMap: Record<string, number> = {};
    if (fileCounts) {
      fileCounts.forEach((fc) => {
        fileCountMap[fc.product_id] = (fileCountMap[fc.product_id] || 0) + 1;
      });
    }

    // Calculate total price for each product (sum of file prices + embedded product prices)
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        // Get file prices
        const { data: files } = await serverClient
          .from('product_files')
          .select('price_cents')
          .eq('product_id', product.id)
          .eq('deleted', false);

        const filePriceTotal = (files || []).reduce(
          (sum, file) => sum + (file.price_cents || 0),
          0
        );

        // Get embedded product prices
        const { data: components } = await serverClient
          .from('product_components')
          .select('inherited_price_cents')
          .eq('parent_product_id', product.id)
          .eq('deleted', false);

        const componentPriceTotal = (components || []).reduce(
          (sum, comp) => sum + (comp.inherited_price_cents || 0),
          0
        );

        const totalPriceCents = filePriceTotal + componentPriceTotal;

        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          status: product.status,
          creator_name: product.users?.name || 'Unknown',
          creator_handle: product.users?.handle || 'unknown',
          file_count: fileCountMap[product.id] || 0,
          total_price_cents: totalPriceCents,
        };
      })
    );

    return new Response(JSON.stringify({ products: productsWithPrices }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search embeddable products error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to search products',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
