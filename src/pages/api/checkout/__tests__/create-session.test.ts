/**
 * Create Stripe Checkout Session Endpoint Tests
 *
 * Tests for /api/checkout/create-session (POST)
 *
 * Coverage:
 * - Authentication required
 * - Empty cart validation
 * - Product validation (status, pricing)
 * - Line items building
 * - Stripe session creation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules BEFORE imports to prevent Stripe initialization
vi.mock('@/lib/auth');
vi.mock('@/lib/data-access/cart');
vi.mock('@/lib/data-access/products');
vi.mock('@/lib/payments');
vi.mock('@/lib/payments/client', () => ({
  stripe: null,
}));

import { POST } from '../create-session';
import * as auth from '@/lib/auth';
import * as cart from '@/lib/data-access/cart';
import * as products from '@/lib/data-access/products';
import * as payments from '@/lib/payments';

describe('POST /api/checkout/create-session', () => {
  const VALID_CART_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VALID_PRODUCT_ID = '223e4567-e89b-12d3-a456-426614174000';
  const VALID_CART_ITEM_ID = '323e4567-e89b-12d3-a456-426614174000';

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

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 401 when refresh token is missing', async () => {
      mockCookies.get = vi.fn((name: string) => {
        if (name === 'sb-access-token') return { value: 'mock-access-token' };
        return undefined;
      });

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid session');
    });
  });

  describe('Cart Validation', () => {
    it('should return 500 when cart creation fails', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to get cart');
    });

    it('should return 400 when cart is empty', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.getCartItems).mockResolvedValue([]);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Cart is empty');
    });

    it('should return 400 when cart items is null', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.getCartItems).mockResolvedValue(null as any);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Cart is empty');
    });
  });

  describe('Product Validation', () => {
    beforeEach(() => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);
    });

    it('should return 500 when product does not exist', async () => {
      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Product not found');
    });

    it('should return 500 when product status is draft', async () => {
      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Draft Product',
        status: 'draft',
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('cannot be purchased');
      expect(data.error).toContain('Current status: draft');
    });

    it('should return 500 when product status is archived', async () => {
      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Archived Product',
        status: 'archived',
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('cannot be purchased');
      expect(data.error).toContain('Current status: archived');
    });

    it('should return 500 when product has zero price', async () => {
      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Free Product',
        status: 'public',
      } as any);

      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        totalPrice: 0,
        filePriceTotal: 0,
        documentPriceTotal: 0,
        embeddedPriceTotal: 0,
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('has no price set');
    });
  });

  describe('Checkout Session Creation', () => {
    beforeEach(() => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 2,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        description: 'A test product',
        status: 'public',
        cover_image_url: 'https://example.com/image.jpg',
      } as any);

      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        totalPrice: 1999,
        filePriceTotal: 1500,
        documentPriceTotal: 299,
        embeddedPriceTotal: 200,
      } as any);

      vi.mocked(products.getProductFiles).mockResolvedValue([
        { id: 'file-1', filename: 'test.pdf' },
        { id: 'file-2', filename: 'test.stl' },
      ] as any);
    });

    it('should create Stripe checkout session successfully', async () => {
      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
    });

    it('should build line items with correct price data', async () => {
      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(payments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lineItems: [
            {
              price_data: {
                currency: 'usd',
                unit_amount: 1999,
                product_data: {
                  name: 'Test Product',
                  description: 'A test product',
                  images: ['https://example.com/image.jpg'],
                  metadata: {
                    product_id: VALID_PRODUCT_ID,
                    file_ids: 'file-1,file-2',
                    files_price: '1500',
                    documents_price: '299',
                    embedded_price: '200',
                  },
                },
              },
              quantity: 2,
            },
          ],
        })
      );
    });

    it('should include customer email', async () => {
      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(payments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: 'buyer@example.com',
        })
      );
    });

    it('should include metadata with userId and cartId', async () => {
      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(payments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user-123',
            cartId: VALID_CART_ID,
          },
        })
      );
    });

    it('should include success and cancel URLs with origin', async () => {
      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(payments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: 'http://localhost:4321/checkout/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: 'http://localhost:4321/checkout/failed?error=cancelled',
        })
      );
    });

    it('should handle product without cover image', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        description: 'A test product',
        status: 'public',
        cover_image_url: null,
      } as any);

      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      const call = vi.mocked(payments.createCheckoutSession).mock.calls[0][0];
      expect(call.lineItems[0].price_data.product_data.images).toEqual([]);
    });

    it('should handle product without description', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        description: null,
        status: 'public',
        cover_image_url: 'https://example.com/image.jpg',
      } as any);

      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      const call = vi.mocked(payments.createCheckoutSession).mock.calls[0][0];
      expect(call.lineItems[0].price_data.product_data.description).toBeUndefined();
    });

    it('should handle multiple cart items', async () => {
      const product2Id = '323e4567-e89b-12d3-a456-426614174000';

      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 2,
        },
        {
          id: '423e4567-e89b-12d3-a456-426614174000',
          cart_id: VALID_CART_ID,
          product_id: product2Id,
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById)
        .mockResolvedValueOnce({
          id: VALID_PRODUCT_ID,
          title: 'Product 1',
          status: 'public',
        } as any)
        .mockResolvedValueOnce({
          id: product2Id,
          title: 'Product 2',
          status: 'public',
        } as any);

      vi.mocked(products.getProductPriceBreakdown)
        .mockResolvedValueOnce({
          totalPrice: 1999,
          filePriceTotal: 1999,
          documentPriceTotal: 0,
          embeddedPriceTotal: 0,
        } as any)
        .mockResolvedValueOnce({
          totalPrice: 999,
          filePriceTotal: 999,
          documentPriceTotal: 0,
          embeddedPriceTotal: 0,
        } as any);

      vi.mocked(products.getProductFiles).mockResolvedValue([]);

      vi.mocked(payments.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      const call = vi.mocked(payments.createCheckoutSession).mock.calls[0][0];
      expect(call.lineItems).toHaveLength(2);
      expect(call.lineItems[0].quantity).toBe(2);
      expect(call.lineItems[1].quantity).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe session creation failure', async () => {
      vi.mocked(cart.getOrCreateCart).mockResolvedValue({
        id: VALID_CART_ID,
        user_id: 'user-123',
      } as any);

      vi.mocked(cart.getCartItems).mockResolvedValue([
        {
          id: VALID_CART_ITEM_ID,
          cart_id: VALID_CART_ID,
          product_id: VALID_PRODUCT_ID,
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        status: 'public',
      } as any);

      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        totalPrice: 1999,
        filePriceTotal: 1999,
        documentPriceTotal: 0,
        embeddedPriceTotal: 0,
      } as any);

      vi.mocked(products.getProductFiles).mockResolvedValue([]);

      vi.mocked(payments.createCheckoutSession).mockRejectedValue(
        new Error('Stripe API error')
      );

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Stripe API error');
    });

    it('should handle generic errors', async () => {
      vi.mocked(cart.getOrCreateCart).mockRejectedValue('Unexpected error');

      mockRequest = new Request('http://localhost:4321/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create checkout session');
    });
  });
});
