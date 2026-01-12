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
import { POST } from '../update';
import * as auth from '@/lib/auth';
import * as cart from '@/lib/data-access/cart';

// Mock modules
vi.mock('@/lib/auth');
vi.mock('@/lib/data-access/cart');

describe('POST /api/cart/update', () => {
  const VALID_CART_ITEM_ID = '123e4567-e89b-12d3-a456-426614174000';

  let mockRequest: Request;
  let mockCookies: any;

  beforeEach(() => {
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
    it('should return 401 when access token is missing', async () => {
      mockCookies.get = vi.fn((name: string) => {
        if (name === 'sb-refresh-token') return { value: 'mock-refresh-token' };
        return undefined;
      });

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Not authenticated');
      expect(auth.setSession).not.toHaveBeenCalled();
    });

    it('should return 401 when refresh token is missing', async () => {
      mockCookies.get = vi.fn((name: string) => {
        if (name === 'sb-access-token') return { value: 'mock-access-token' };
        return undefined;
      });

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 401 when session is invalid', async () => {
      vi.mocked(auth.setSession).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid session', name: 'AuthError', status: 401 },
      } as any);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid session');
    });

    it('should return 401 when setSession throws an error', async () => {
      vi.mocked(auth.setSession).mockRejectedValue(new Error('Auth service down'));

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication failed');
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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        3,
        {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        }
      );
    });

    it('should handle quantity of 0 (removes item)', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 0 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        0,
        expect.any(Object)
      );
    });

    it('should reject negative quantity (min is 0)', async () => {
      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: -1 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        100,
        expect.any(Object)
      );
    });

    it('should return 500 when update fails', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(false);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Token Passing', () => {
    it('should pass access and refresh tokens to updateCartItemQuantity', async () => {
      vi.mocked(cart.updateCartItemQuantity).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID, quantity: 2 }),
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(cart.updateCartItemQuantity).toHaveBeenCalledWith(
        VALID_CART_ITEM_ID,
        2,
        {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        }
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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

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

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to update cart item');
    });
  });
});
