/**
 * Credits Checkout Endpoint Tests
 *
 * Tests for /api/checkout/credits-checkout (POST)
 *
 * Coverage:
 * - Authentication required
 * - Empty cart validation
 * - Product validation (status, pricing)
 * - Credit balance checking
 * - Sale creation
 * - Cart clearing
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../credits-checkout';
import * as auth from '@/lib/auth';
import * as cart from '@/lib/data-access/cart';
import * as products from '@/lib/data-access/products';
import * as sales from '@/lib/data-access/sales';
import * as users from '@/lib/data-access/users';

// Mock modules
vi.mock('@/lib/auth');
vi.mock('@/lib/data-access/cart');
vi.mock('@/lib/data-access/products');
vi.mock('@/lib/data-access/sales');
vi.mock('@/lib/data-access/users');

describe('POST /api/checkout/credits-checkout', () => {
  const VALID_CART_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VALID_PRODUCT_ID = '223e4567-e89b-12d3-a456-426614174000';
  const VALID_CART_ITEM_ID = '323e4567-e89b-12d3-a456-426614174000';
  const VALID_SALE_ID = '423e4567-e89b-12d3-a456-426614174000';

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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('cannot be purchased');
      expect(data.error).toContain('Current status: archived');
    });
  });

  describe('Credit Balance Checking', () => {
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
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        status: 'public',
        user_id: 'creator-123',
      } as any);

      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        totalPrice: 1999,
        filePriceTotal: 1999,
        documentPriceTotal: 0,
        embeddedPriceTotal: 0,
      } as any);
    });

    it('should return 404 when user not found', async () => {
      vi.mocked(users.getUserById).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });

    it('should return 400 when user has insufficient credits', async () => {
      vi.mocked(users.getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 1000, // Not enough for 1999 cent purchase
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Insufficient credits');
      expect(data.required).toBe(1999);
      expect(data.available).toBe(1000);
      expect(data.shortfall).toBe(999);
    });

    it('should allow purchase when user has exact credits', async () => {
      vi.mocked(users.getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 1999,
      } as any);

      // Mock updateUserCreditsBalance for buyer deduction
      vi.mocked(users.updateUserCreditsBalance).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 0,
      } as any);

      vi.mocked(products.getProductComponents).mockResolvedValue([]);
      vi.mocked(products.ensureProductDocumentPDFs).mockResolvedValue(undefined);

      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.totalPriceCents).toBe(1999);
      expect(data.creditsRemaining).toBe(0);
    });

    it('should allow purchase when user has more credits than needed', async () => {
      vi.mocked(users.getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 5000,
      } as any);

      // Mock updateUserCreditsBalance for buyer deduction
      vi.mocked(users.updateUserCreditsBalance).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 3001,
      } as any);

      vi.mocked(products.getProductComponents).mockResolvedValue([]);
      vi.mocked(products.ensureProductDocumentPDFs).mockResolvedValue(undefined);

      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.creditsRemaining).toBe(3001);
    });
  });

  describe('Request Body Parsing', () => {
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
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        status: 'public',
        user_id: 'creator-123',
      } as any);

      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        totalPrice: 1999,
        filePriceTotal: 1999,
        documentPriceTotal: 0,
        embeddedPriceTotal: 0,
      } as any);

      vi.mocked(users.getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 5000,
      } as any);

      // Mock updateUserCreditsBalance for buyer deduction
      vi.mocked(users.updateUserCreditsBalance).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 3001,
      } as any);

      vi.mocked(products.getProductComponents).mockResolvedValue([]);
      vi.mocked(products.ensureProductDocumentPDFs).mockResolvedValue(undefined);

      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      vi.mocked(cart.clearCart).mockResolvedValue(true);
    });

    it('should accept empty request body', async () => {
      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
    });

    it('should accept shipping address in request body', async () => {
      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94105',
            country: 'US',
          },
        }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      // Verify shipping address was passed to createSale
      expect(sales.createSale).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94105',
            country: 'US',
          },
        })
      );
    });

    it('should accept order notes in request body', async () => {
      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_notes: 'Please gift wrap this order',
        }),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(200);
      // Verify order notes were passed to createSale
      expect(sales.createSale).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNotes: 'Please gift wrap this order',
        })
      );
    });
  });

  describe('Sale Creation', () => {
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
          quantity: 1,
        },
      ] as any);

      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Test Product',
        status: 'public',
        user_id: 'creator-123',
      } as any);

      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        totalPrice: 1999,
        filePriceTotal: 1999,
        documentPriceTotal: 0,
        embeddedPriceTotal: 0,
      } as any);

      vi.mocked(users.getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 5000,
      } as any);

      // Mock updateUserCreditsBalance for buyer deduction
      vi.mocked(users.updateUserCreditsBalance).mockResolvedValue({
        id: 'user-123',
        email: 'buyer@example.com',
        credits_balance: 3001,
      } as any);

      vi.mocked(products.getProductComponents).mockResolvedValue([]);
      vi.mocked(products.ensureProductDocumentPDFs).mockResolvedValue(undefined);
      vi.mocked(cart.clearCart).mockResolvedValue(true);
    });

    it('should create sale with correct parameters', async () => {
      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(sales.createSale).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          userEmail: 'buyer@example.com',
          priceCents: 1999,
          taxCents: 0,
          currency: 'credits',
          status: 'paid',
          paymentMethod: 'credits',
        })
      );
    });

    it('should return 500 when sale creation fails', async () => {
      vi.mocked(sales.createSale).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create sale');
    });

    it('should create sale items for each cart item', async () => {
      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(sales.createSaleItem).toHaveBeenCalledWith(
        expect.objectContaining({
          saleId: VALID_SALE_ID,
          productId: VALID_PRODUCT_ID,
          priceCents: 1999,
          currency: 'credits',
          quantity: 1,
        })
      );
    });

    it('should clear cart after successful purchase', async () => {
      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(cart.clearCart).toHaveBeenCalledWith(VALID_CART_ID);
    });

    it('should return sale ID and redirect URL', async () => {
      vi.mocked(sales.createSale).mockResolvedValue({
        id: VALID_SALE_ID,
        user_id: 'user-123',
        price_cents: 1999,
      } as any);

      vi.mocked(sales.createSaleItem).mockResolvedValue({
        id: 'sale-item-123',
        sale_id: VALID_SALE_ID,
      } as any);

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      const data = await response.json();
      expect(data.saleId).toBe(VALID_SALE_ID);
      expect(data.redirectUrl).toBe(`/checkout/success?sale_id=${VALID_SALE_ID}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle generic errors', async () => {
      vi.mocked(cart.getOrCreateCart).mockRejectedValue('Unexpected error');

      mockRequest = new Request('http://localhost/api/checkout/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to process credits checkout');
    });
  });
});
