import { makeContext } from '@gameloopers/api/test-support';
/**
 * Update Cart Item Endpoint Tests
 *
 * Tests for /api/cart/update (POST)
 *
 * Coverage:
 * - Authentication required
 * - Quantity update validation
 * - Zero or negative quantity removes item
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cartUpdate } from '@gameloopers/api/controllers/cart/update';
import * as auth from '@gameloopers/core/auth';
import * as cart from '@gameloopers/core/data-access/cart';

// Mock modules
vi.mock('@gameloopers/core/auth');
vi.mock('@gameloopers/core/data-access/cart');

describe('POST /api/cart/update', () => {
  const VALID_CART_ITEM_ID = '123e4567-e89b-12d3-a456-426614174000';

  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful auth mock
    vi.mocked(auth.setSession).mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'buyer@example.com' },
        session: { access_token: 'token', refresh_token: 'refresh' },
      },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    // Token verification, expiry and refresh belong to the gateway and are
    // tested once in gateway.test.ts. This is the controller's own decision.
    it('rejects a caller who is not signed in', async () => {
      const response = await cartUpdate(makeContext({ userId: null, body: {} }));

      expect(response.status).toBe(401);
    });
  });

  describe('Quantity Update', () => {
    it('should update cart item quantity successfully', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 3 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        3
      );
    });

    it('should handle quantity of 0 (removes item)', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 0 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        0
      );
    });

    it('should reject negative quantity (min is 0)', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: -1 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should update to large quantities', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 100 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(200);
      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        100
      );
    });

    it('should return 500 when update fails', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(false);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to update cart item');
    });
  });

  describe('Request Validation', () => {
    it('should require cartItemId', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 2 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should require valid UUID for cartItemId', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: 'not-a-uuid', quantity: 2 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should require quantity', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should reject non-integer quantity', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2.5 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should handle malformed JSON', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Data Layer Call', () => {
    // This previously asserted that the route forwarded the caller's access and
    // refresh tokens to updateCartItemQuantity. It never did, and the function has
    // no such parameter — the route authenticates from cookies and the data layer
    // runs with the service role. The assertion documented an interface that did
    // not exist, so it now pins the real one.
    it('should call updateCartItemQuantity with the item id and quantity only', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      await cartUpdate(makeContext({ request: mockRequest }));

      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        2
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockRejectedValue(
        new Error('Database connection failed')
      );

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle generic errors', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockRejectedValue('Unexpected error');

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await cartUpdate(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to update cart item');
    });
  });
});
