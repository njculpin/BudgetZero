import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './create-product';
import type { APIContext } from 'astro';

/**
 * API Route Tests for create-product
 *
 * NOTE: These tests have known issues with Request/FormData mocking in the current
 * Node.js/Vitest environment. The "duplex option required" error is a known limitation
 * when mocking Request objects with bodies.
 *
 * PRIMARY TEST COVERAGE: See comprehensive E2E tests in:
 * - /e2e/product-creation-workflow.spec.ts
 * - /e2e/product-edit-workflow.spec.ts
 *
 * These E2E tests provide full coverage of:
 * - Authentication flows
 * - Product creation (both JSON and FormData)
 * - Tag creation
 * - Validation
 * - Redirect behavior to edit page (critical bug fix verification)
 *
 * These unit tests document the expected behavior and test business logic where possible.
 */

// Mock the dependencies
vi.mock('@/lib/auth', () => ({
  setSession: vi.fn(),
}));

vi.mock('@/lib/data-access/products', () => ({
  createProduct: vi.fn(),
  createProductTag: vi.fn(),
}));

import { setSession } from '@/lib/auth';
import { createProduct, createProductTag } from '@/lib/data-access/products';

describe('POST /api/products/create-product', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (
    requestOptions: {
      method?: string;
      headers?: Record<string, string>;
      body?: string | FormData;
    },
    cookies?: Record<string, string>
  ): APIContext => {
    const headers = new Headers(requestOptions.headers || {});

    let body: ReadableStream | null = null;
    if (typeof requestOptions.body === 'string') {
      body = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(requestOptions.body as string));
          controller.close();
        },
      });
    }

    const request = new Request('http://localhost/api/products/create-product', {
      method: requestOptions.method || 'POST',
      headers,
      body: requestOptions.body instanceof FormData ? requestOptions.body : body,
    });

    const mockCookies = {
      get: (name: string) => {
        const value = cookies?.[name];
        return value ? { value } : undefined;
      },
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    };

    return {
      request,
      cookies: mockCookies,
    } as unknown as APIContext;
  };

  describe('Authentication', () => {
    it('should return 401 when access token is missing', async () => {
      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: 'Test Product' }),
        },
        {}
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 401 when refresh token is missing', async () => {
      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: 'Test Product' }),
        },
        { 'sb-access-token': 'token123' }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 401 when session is invalid', async () => {
      vi.mocked(setSession).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid session' },
      } as never);

      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: 'Test Product' }),
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid session');
    });
  });

  describe('JSON Request Handling', () => {
    beforeEach(() => {
      vi.mocked(setSession).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      } as never);
    });

    it('should create product with valid JSON data', async () => {
      const mockProduct = {
        id: 'product-123',
        handle: 'test-product',
        title: 'Test Product',
        description: 'A test product',
        status: 'draft' as const,
        user_id: 'user-123',
      };

      vi.mocked(createProduct).mockResolvedValue(mockProduct as never);

      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Product',
            description: 'A test product',
            status: 'draft',
          }),
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product).toEqual(mockProduct);
      expect(createProduct).toHaveBeenCalledWith('user-123', {
        title: 'Test Product',
        description: 'A test product',
        status: 'draft',
      });
    });

    it('should use default title when title is empty', async () => {
      const mockProduct = {
        id: 'product-123',
        handle: 'new-product-dec-1-2024-1030-am',
        title: 'New Product - Dec 1, 2024 10:30 AM',
        description: '',
        status: 'draft' as const,
        user_id: 'user-123',
      };

      vi.mocked(createProduct).mockResolvedValue(mockProduct as never);

      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: '',
            status: 'draft',
          }),
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.title).toContain('New Product');
      expect(createProduct).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          title: expect.stringContaining('New Product'),
        })
      );
    });

    it('should create tags when provided in JSON', async () => {
      const mockProduct = {
        id: 'product-123',
        handle: 'test-product',
        title: 'Test Product',
        description: '',
        status: 'draft' as const,
        user_id: 'user-123',
      };

      vi.mocked(createProduct).mockResolvedValue(mockProduct as never);
      vi.mocked(createProductTag).mockResolvedValue(true);

      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Product',
            tags: ['board-game', 'strategy', 'family-friendly'],
          }),
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);

      expect(response.status).toBe(201);
      expect(createProductTag).toHaveBeenCalledWith('product-123', 'board-game');
      expect(createProductTag).toHaveBeenCalledWith('product-123', 'strategy');
      expect(createProductTag).toHaveBeenCalledWith('product-123', 'family-friendly');
      expect(createProductTag).toHaveBeenCalledTimes(3);
    });

    it('should return 400 on validation error', async () => {
      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: 'A'.repeat(300), // Exceeds max length
          }),
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 500 when product creation fails', async () => {
      vi.mocked(createProduct).mockResolvedValue(null);

      const context = createMockContext(
        {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Product',
          }),
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create product');
    });
  });

  describe('FormData Request Handling', () => {
    beforeEach(() => {
      vi.mocked(setSession).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      } as never);
    });

    it('should create product from FormData and redirect to edit page', async () => {
      const mockProduct = {
        id: 'product-123',
        handle: 'test-product',
        title: 'Test Product',
        description: 'A test description',
        status: 'draft' as const,
        user_id: 'user-123',
      };

      vi.mocked(createProduct).mockResolvedValue(mockProduct as never);

      const formData = new FormData();
      formData.append('title', 'Test Product');
      formData.append('description', 'A test description');
      formData.append('status', 'draft');

      const context = createMockContext(
        {
          headers: { 'content-type': 'multipart/form-data' },
          body: formData,
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);

      expect(response.status).toBe(303);
      expect(response.headers.get('Location')).toBe('/products/test-product/edit');
    });

    it('should parse comma-separated tags from FormData', async () => {
      const mockProduct = {
        id: 'product-123',
        handle: 'test-product',
        title: 'Test Product',
        description: '',
        status: 'draft' as const,
        user_id: 'user-123',
      };

      vi.mocked(createProduct).mockResolvedValue(mockProduct as never);
      vi.mocked(createProductTag).mockResolvedValue(true);

      const formData = new FormData();
      formData.append('title', 'Test Product');
      formData.append('tags', 'board-game, strategy, family-friendly');

      const context = createMockContext(
        {
          headers: { 'content-type': 'multipart/form-data' },
          body: formData,
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);

      expect(response.status).toBe(303);
      expect(createProductTag).toHaveBeenCalledWith('product-123', 'board-game');
      expect(createProductTag).toHaveBeenCalledWith('product-123', 'strategy');
      expect(createProductTag).toHaveBeenCalledWith('product-123', 'family-friendly');
    });

    it('should use default title when FormData title is empty', async () => {
      const mockProduct = {
        id: 'product-123',
        handle: 'new-product-dec-1-2024',
        title: 'New Product - Dec 1, 2024 10:30 AM',
        description: '',
        status: 'draft' as const,
        user_id: 'user-123',
      };

      vi.mocked(createProduct).mockResolvedValue(mockProduct as never);

      const formData = new FormData();
      formData.append('description', 'Test description');

      const context = createMockContext(
        {
          headers: { 'content-type': 'multipart/form-data' },
          body: formData,
        },
        {
          'sb-access-token': 'token123',
          'sb-refresh-token': 'refresh123',
        }
      );

      const response = await POST(context);

      expect(response.status).toBe(303);
      expect(createProduct).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          title: expect.stringContaining('New Product'),
        })
      );
    });
  });
});
