/**
 * Tests for the add-to-cart controller.
 *
 * The authentication cases that used to live here - missing access token,
 * missing refresh token, invalid session, auth service throwing - are gone on
 * purpose. That logic is no longer duplicated into each route; it belongs to the
 * gateway and is tested once, in gateway.test.ts. What remains is the only
 * authentication question this controller actually decides: what to do when
 * nobody is signed in.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Cart, CartItem, Product } from '@gameloopers/core/types';
import { cartAddToCart } from '../add-to-cart';
import { makeContext } from '../../../test-support';
import * as cart from '@gameloopers/core/data-access/cart';
import * as products from '@gameloopers/core/data-access/products';

vi.mock('@gameloopers/core/data-access/cart');
vi.mock('@gameloopers/core/data-access/products');

const VALID_PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_CART_ID = '223e4567-e89b-12d3-a456-426614174000';
const VALID_CART_ITEM_ID = '323e4567-e89b-12d3-a456-426614174000';

function productWithStatus(status: string): Product {
  return { id: VALID_PRODUCT_ID, status, title: 'A Product' } as Product;
}

describe('cartAddToCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cart.getOrCreateCart).mockResolvedValue({
      id: VALID_CART_ID,
      user_id: 'user-123',
    } as Cart);
    vi.mocked(cart.addToCart).mockResolvedValue({
      id: VALID_CART_ITEM_ID,
      cart_id: VALID_CART_ID,
      product_id: VALID_PRODUCT_ID,
      quantity: 1,
    } as CartItem);
    vi.mocked(products.getProductById).mockResolvedValue(productWithStatus('public'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an anonymous caller before touching the database', async () => {
    const response = await cartAddToCart(
      makeContext({ userId: null, body: { productId: VALID_PRODUCT_ID, quantity: 1 } })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Not authenticated' });
    expect(products.getProductById).not.toHaveBeenCalled();
    expect(cart.getOrCreateCart).not.toHaveBeenCalled();
  });

  it('adds a public product to the signed-in user cart', async () => {
    const response = await cartAddToCart(
      makeContext({ body: { productId: VALID_PRODUCT_ID, quantity: 2 } })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(cart.getOrCreateCart).toHaveBeenCalledWith('user-123');
    expect(cart.addToCart).toHaveBeenCalledWith(VALID_CART_ID, VALID_PRODUCT_ID, 2);
  });

  it('defaults the quantity to 1 when it is omitted', async () => {
    await cartAddToCart(makeContext({ body: { productId: VALID_PRODUCT_ID } }));

    expect(cart.addToCart).toHaveBeenCalledWith(VALID_CART_ID, VALID_PRODUCT_ID, 1);
  });

  it('returns 404 for a product that does not exist', async () => {
    vi.mocked(products.getProductById).mockResolvedValue(null);

    const response = await cartAddToCart(
      makeContext({ body: { productId: VALID_PRODUCT_ID, quantity: 1 } })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Product not found' });
    expect(cart.addToCart).not.toHaveBeenCalled();
  });

  it.each(['draft', 'archived'])(
    'refuses to add a product whose status is %s',
    async (status) => {
      vi.mocked(products.getProductById).mockResolvedValue(productWithStatus(status));

      const response = await cartAddToCart(
        makeContext({ body: { productId: VALID_PRODUCT_ID, quantity: 1 } })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('cannot be purchased');
      expect(data.error).toContain(`Current status: ${status}`);
      expect(cart.addToCart).not.toHaveBeenCalled();
    }
  );

  it.each(['private', 'public'])(
    'allows a product whose status is %s',
    async (status) => {
      vi.mocked(products.getProductById).mockResolvedValue(productWithStatus(status));

      const response = await cartAddToCart(
        makeContext({ body: { productId: VALID_PRODUCT_ID, quantity: 1 } })
      );

      expect(response.status).toBe(200);
    }
  );

  it('rejects a malformed body rather than passing it through', async () => {
    const response = await cartAddToCart(
      makeContext({ body: { productId: 'not-a-uuid', quantity: 0 } })
    );

    expect(response.status).toBe(400);
    expect(products.getProductById).not.toHaveBeenCalled();
  });

  it('reports a failure to create the cart', async () => {
    vi.mocked(cart.getOrCreateCart).mockResolvedValue(null);

    const response = await cartAddToCart(
      makeContext({ body: { productId: VALID_PRODUCT_ID, quantity: 1 } })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to get cart' });
  });

  it('reports a failure to add the item', async () => {
    vi.mocked(cart.addToCart).mockResolvedValue(null);

    const response = await cartAddToCart(
      makeContext({ body: { productId: VALID_PRODUCT_ID, quantity: 1 } })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to add product to cart' });
  });
});
