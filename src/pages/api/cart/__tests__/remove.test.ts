/**
 * Remove Cart Item Endpoint Tests
 *
 * Tests for /api/cart/remove (POST)
 *
 * Coverage:
 * - Authentication required
 * - Cart item removal
 * - Validation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../remove';
import * as auth from '@/lib/auth';
import * as cart from '@/lib/data-access/cart';

// Mock modules
vi.mock('@/lib/auth');
vi.mock('@/lib/data-access/cart');

describe('POST /api/cart/remove', () => {
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

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
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

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
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

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid session');
    });

    it('should return 401 when setSession throws an error', async () => {
      vi.mocked(auth.setSession).mockRejectedValue(new Error('Auth service down'));

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication failed');
    });
  });

  describe('Cart Item Removal', () => {
    it('should remove cart item successfully', async () => {
      vi.mocked(cart.removeFromCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(cart.removeFromCart).toHaveBeenCalledWith(VALID_CART_ITEM_ID);
    });

    it('should return 500 when removal fails', async () => {
      vi.mocked(cart.removeFromCart).mockResolvedValue(false);

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to remove cart item');
    });

    it('should call removeFromCart with correct cart item ID', async () => {
      const differentCartItemId = '223e4567-e89b-12d3-a456-426614174000';
      vi.mocked(cart.removeFromCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: differentCartItemId }),
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(cart.removeFromCart).toHaveBeenCalledWith(differentCartItemId);
      expect(cart.removeFromCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request Validation', () => {
    it('should require cartItemId', async () => {
      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should require valid UUID for cartItemId', async () => {
      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: 'not-a-uuid' }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should reject empty string cartItemId', async () => {
      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: '' }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should reject null cartItemId', async () => {
      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: null }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should handle malformed JSON', async () => {
      mockRequest = new Request('http://localhost/api/cart/remove', {
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

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(cart.removeFromCart).mockRejectedValue(
        new Error('Database connection failed')
      );

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle generic errors', async () => {
      vi.mocked(cart.removeFromCart).mockRejectedValue('Unexpected error');

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to remove cart item');
    });

    it('should provide specific error message for validation errors', async () => {
      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: 'invalid' }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeInstanceOf(Array);
    });
  });

  describe('Response Format', () => {
    it('should return JSON with success flag on successful removal', async () => {
      vi.mocked(cart.removeFromCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should return JSON with error message on failure', async () => {
      vi.mocked(cart.removeFromCart).mockResolvedValue(false);

      mockRequest = new Request('http://localhost/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: VALID_CART_ITEM_ID }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.success).toBeUndefined();
    });
  });
});
