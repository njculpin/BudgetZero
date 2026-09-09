/**
 * Purchase Entitlement Tests
 *
 * `hasUserPurchasedProduct` decides who may download what. It previously consulted
 * only `sale_items.product_id`, which never contains embedded components — so a
 * customer who bought a bundle was refused the very components they had paid for,
 * breaking the product-in-product model the platform is built on.
 *
 * Access is now derived: line items, expanded one level through
 * `product_components`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasUserPurchasedProduct,
  getPurchasedProductIds,
} from '../sales';
import { serverClient } from '../client';
import { mockTables } from '@/test/supabase-query-mock';

vi.mock('../client', () => ({
  serverClient: { from: vi.fn() },
}));

const BUYER = 'user-buyer';
const BUNDLE = 'product-bundle';
const COMPONENT = 'product-component';
const UNRELATED = 'product-unrelated';

describe('purchase entitlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('grants access to a product bought directly', async () => {
    mockTables(serverClient, {
      sales: { data: [{ id: 'sale-1' }], error: null },
      sale_items: { data: [{ product_id: BUNDLE }], error: null },
      product_components: { data: [], error: null },
    });

    await expect(hasUserPurchasedProduct(BUYER, BUNDLE)).resolves.toBe(true);
  });

  it('grants access to a component embedded in a purchased bundle', async () => {
    mockTables(serverClient, {
      sales: { data: [{ id: 'sale-1' }], error: null },
      sale_items: { data: [{ product_id: BUNDLE }], error: null },
      product_components: {
        data: [{ child_product_id: COMPONENT }],
        error: null,
      },
    });

    // The component is never its own line item; entitlement must be derived.
    await expect(hasUserPurchasedProduct(BUYER, COMPONENT)).resolves.toBe(true);
  });

  it('refuses a product that was neither bought nor embedded', async () => {
    mockTables(serverClient, {
      sales: { data: [{ id: 'sale-1' }], error: null },
      sale_items: { data: [{ product_id: BUNDLE }], error: null },
      product_components: {
        data: [{ child_product_id: COMPONENT }],
        error: null,
      },
    });

    await expect(hasUserPurchasedProduct(BUYER, UNRELATED)).resolves.toBe(false);
  });

  it('refuses everything when the user has no paid sales', async () => {
    mockTables(serverClient, {
      sales: { data: [], error: null },
    });

    await expect(hasUserPurchasedProduct(BUYER, BUNDLE)).resolves.toBe(false);
  });

  it('refuses when the sales lookup errors rather than failing open', async () => {
    mockTables(serverClient, {
      sales: { data: null, error: { message: 'connection lost' } },
    });

    // A database failure must not become an entitlement grant.
    await expect(hasUserPurchasedProduct(BUYER, BUNDLE)).resolves.toBe(false);
  });

  it('returns the full accessible set, parents and components together', async () => {
    mockTables(serverClient, {
      sales: { data: [{ id: 'sale-1' }], error: null },
      sale_items: {
        data: [{ product_id: BUNDLE }, { product_id: 'product-other' }],
        error: null,
      },
      product_components: {
        data: [{ child_product_id: COMPONENT }],
        error: null,
      },
    });

    const ids = await getPurchasedProductIds(BUYER);

    expect(ids).toEqual(new Set([BUNDLE, 'product-other', COMPONENT]));
  });

  it('still grants directly purchased products when component lookup fails', async () => {
    mockTables(serverClient, {
      sales: { data: [{ id: 'sale-1' }], error: null },
      sale_items: { data: [{ product_id: BUNDLE }], error: null },
      product_components: { data: null, error: { message: 'timeout' } },
    });

    // Degrading to direct purchases only is correct: it withholds access rather
    // than granting it, and the customer can still reach what they bought.
    const ids = await getPurchasedProductIds(BUYER);

    expect(ids).toEqual(new Set([BUNDLE]));
  });
});
