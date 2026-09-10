import { makeContext } from '@gameloopers/api/test-support';
/**
 * Clear Cart Endpoint Tests
 *
 * Tests for /api/cart/clear (POST)
 *
 * Coverage:
 * - Authentication required
 * - Cart clearing
 * - Cart creation if not exists
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cartClear } from '@gameloopers/api/controllers/cart/clear';
import * as auth from '@gameloopers/core/auth';
import * as cart from '@gameloopers/core/data-access/cart';

// Mock modules
vi.mock('@gameloopers/core/auth');
vi.mock('@gameloopers/core/data-access/cart');

describe('POST /api/cart/clear', () => {
  // Which user the request is authenticated as. The gateway settles this before
  // the controller runs, so a test states it directly instead of arranging a
  // session mock to produce it.
  let expectedUserId: string;
  const VALID_CART_ID = '123e4567-e89b-12d3-a456-426614174000';

  let mockRequest: Request;
  let mockCookies: any;

  beforeEach(() => {
    expectedUserId = 'user-123';
    vi.clearAllMocks();

    mockCookies = {
      get: vi.fn((name: string) => {
        if (name === 'sb-access-token') return { value: 'mock-access-token' };
        if (name === 'sb-refresh-token') return { value: 'mock-refresh-token' };
        return undefined;
      }),
    };

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
    // The gateway resolves identity before a controller runs, so the cases
    // that used to live here — missing token, expired token, invalid
    // signature — are tested once in gateway.test.ts rather than in every
    // controller. What remains is this controller's own decision.
    it('rejects a caller who is not signed in', async () => {
      const response = await cartClear(makeContext({ userId: null, ...{ body: {} } }));

      expect(response.status).toBe(401);
    });
  });

  describe('Cart Operations', () => {
    it('should get or create cart for user', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(cart.getOrCreateCart).toHaveBeenCalledWith('user-123');
    });

    it('should return 500 when cart creation fails', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to get cart');
    });

    it('should clear cart successfully', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(cart.clearCart).toHaveBeenCalledWith(VALID_CART_ID);
    });

    it('should return 500 when clear cart fails', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(false);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to clear cart');
    });

    it('should call clearCart with correct cart ID', async () => {
      const differentCartId = '223e4567-e89b-12d3-a456-426614174000';

      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: differentCartId,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(cart.clearCart).toHaveBeenCalledWith(differentCartId);
      expect(cart.clearCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request Handling', () => {
    it('should not require request body', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should work with different user IDs', async () => {
      expectedUserId = 'different-user-456';
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'different-user-456',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(cart.getOrCreateCart).toHaveBeenCalledWith('different-user-456');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockRejectedValue(
        new Error('Database connection failed')
      );

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle generic errors', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockRejectedValue('Unexpected error');

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to clear cart');
    });

    it('should handle errors from getOrCreateCart', async () => {
      vi.mocked(cart.getOrCreateCart).mockRejectedValue(
        new Error('Failed to create cart')
      );

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create cart');
    });
  });

  describe('Response Format', () => {
    it('should return JSON with success flag on successful clear', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.headers.get('Content-Type')).toBe('application/json');
      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should return JSON with error message on failure', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(false);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      expect(response.headers.get('Content-Type')).toBe('application/json');
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.success).toBeUndefined();
    });
  });

  describe('User Isolation', () => {
    it('should only clear cart for authenticated user', async () => {
      expectedUserId = 'user-abc';
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-abc',
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await cartClear(makeContext({ request: mockRequest, userId: expectedUserId }));

      // Verify getOrCreateCart was called with the authenticated user's ID
      expect(cart.getOrCreateCart).toHaveBeenCalledWith('user-abc');
      expect(cart.getOrCreateCart).not.toHaveBeenCalledWith('user-123');
    });
  });
});
