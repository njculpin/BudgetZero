/**
 * Update Product Endpoint Tests
 *
 * Tests for /api/products/update-product (PUT)
 *
 * Coverage:
 * - Authentication required
 * - Product ownership validation
 * - Zod validation (productId, title, description, status, etc.)
 * - Status updates (draft, private, public, archived)
 * - Publish validation requirements:
 *   - Must have at least one file OR embedded component
 *   - Embedded products must be private or public (not draft/archived)
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PUT } from '../update-product';
import * as auth from '@/lib/auth';
import * as products from '@/lib/data-access/products';

// Mock modules
vi.mock('@/lib/auth');
vi.mock('@/lib/data-access/products');

// Valid UUIDs for testing
const VALID_PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_CHILD_PRODUCT_ID = '223e4567-e89b-12d3-a456-426614174000';

describe('PUT /api/products/update-product', () => {
  let mockRequest: Request;
  let mockCookies: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCookies = {
      set: vi.fn(),
      get: vi.fn((name: string) => {
        if (name === 'sb-access-token') return { value: 'mock-access-token' };
        if (name === 'sb-refresh-token') return { value: 'mock-refresh-token' };
        return undefined;
      }),
      delete: vi.fn(),
      has: vi.fn(),
    };

    // Mock successful authentication by default
    vi.mocked(auth.setSession).mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'creator@example.com' },
        session: { access_token: 'token', refresh_token: 'refresh' },
      },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication cookies', async () => {
      mockCookies.get = vi.fn(() => undefined);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Not authenticated');
    });

    it('should validate session with setSession', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'user-123',
        title: 'Test Product',
      } as any);

      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Updated Title',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(auth.setSession).toHaveBeenCalledWith({
        refresh_token: 'mock-refresh-token',
        access_token: 'mock-access-token',
      });
    });

    it('should return 401 if session is invalid', async () => {
      vi.mocked(auth.setSession).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid session' },
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid session');
    });
  });

  describe('Product Ownership', () => {
    it('should return 404 if product not found', async () => {
      const nonExistentUuid = '999e4567-e89b-12d3-a456-426614174000';
      vi.mocked(products.getProductById).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: nonExistentUuid,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Product not found');
    });

    it('should return 403 if user does not own the product', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'other-user-456', // Different user
        title: 'Test Product',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow update if user owns the product', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'user-123', // Same user
        title: 'Test Product',
      } as any);

      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'Updated Title',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    it('should validate productId is a UUID', async () => {
      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'invalid-uuid',
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should accept valid UUID productId', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      vi.mocked(products.getProductById).mockResolvedValue({
        id: validUuid,
        user_id: 'user-123',
        title: 'Test Product',
      } as any);

      vi.mocked(products.updateProduct).mockResolvedValue({
        id: validUuid,
        title: 'Updated Title',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: validUuid,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(200);
    });

    it('should accept valid status values', async () => {
      const statuses = ['draft', 'private', 'public', 'archived'];

      for (const status of statuses) {
        vi.clearAllMocks();

        vi.mocked(auth.setSession).mockResolvedValue({
          data: {
            user: { id: 'user-123', email: 'creator@example.com' },
            session: { access_token: 'token', refresh_token: 'refresh' },
          },
          error: null,
        } as any);

        vi.mocked(products.getProductById).mockResolvedValue({
          id: VALID_PRODUCT_ID,
          user_id: 'user-123',
          title: 'Test Product',
          status: 'draft',
        } as any);

        // Mock validation dependencies for public status
        if (status === 'public') {
          vi.mocked(products.getProductFiles).mockResolvedValue([
            { id: 'file-1', title: 'Test File' },
          ] as any);
          vi.mocked(products.getProductComponents).mockResolvedValue([]);
          vi.mocked(products.getProductDocuments).mockResolvedValue([]);
          vi.mocked(products.getProductImages).mockResolvedValue([
            { id: 'img-1' },
          ] as any);
        }

        vi.mocked(products.updateProduct).mockResolvedValue({
          id: VALID_PRODUCT_ID,
          title: 'Test Product',
          status: status as any,
        } as any);

        mockRequest = new Request('http://localhost/api/products/update-product', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: VALID_PRODUCT_ID,
            status: status,
          }),
        });

        const response = await PUT({
          request: mockRequest,
          cookies: mockCookies,
        } as any);

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Product Updates', () => {
    beforeEach(() => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'user-123',
        title: 'Original Title',
        description: 'Original description',
        status: 'draft',
      } as any);
    });

    it('should update product title', async () => {
      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'New Title',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'New Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(products.updateProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID, {
        title: 'New Title',
        description: undefined,
        status: undefined,
        handle: undefined,
        tags: undefined,
        isEmbeddable: undefined,
        embeddingRoyaltyCents: undefined,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.product.title).toBe('New Title');
    });

    it('should update product description', async () => {
      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        description: 'New description',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          description: 'New description',
        }),
      });

      await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(products.updateProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID, {
        title: undefined,
        description: 'New description',
        status: undefined,
        handle: undefined,
        tags: undefined,
        isEmbeddable: undefined,
        embeddingRoyaltyCents: undefined,
      });
    });

    it('should update embedding settings', async () => {
      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        isEmbeddable: true,
        embeddingRoyaltyCents: 500,
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          isEmbeddable: true,
          embeddingRoyaltyCents: 500,
        }),
      });

      await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(products.updateProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID, {
        title: undefined,
        description: undefined,
        status: undefined,
        handle: undefined,
        tags: undefined,
        isEmbeddable: true,
        embeddingRoyaltyCents: 500,
      });
    });

    it('should update multiple fields at once', async () => {
      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        title: 'New Title',
        description: 'New description',
        status: 'draft',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'New Title',
          description: 'New description',
          status: 'draft',
        }),
      });

      await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(products.updateProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID, {
        title: 'New Title',
        description: 'New description',
        status: 'draft',
        handle: undefined,
        tags: undefined,
        isEmbeddable: undefined,
        embeddingRoyaltyCents: undefined,
      });
    });
  });

  describe('Publish Validation', () => {
    beforeEach(() => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'user-123',
        title: 'Test Product',
        description: 'A test product with sufficient description',
        status: 'draft',
      } as any);
    });

    it('should require at least one file when publishing', async () => {
      // No files and no components
      vi.mocked(products.getProductFiles).mockResolvedValue([]);
      vi.mocked(products.getProductComponents).mockResolvedValue([]);
      vi.mocked(products.getProductDocuments).mockResolvedValue([]);
      vi.mocked(products.getProductImages).mockResolvedValue([{ id: 'img-1' }] as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          status: 'public',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Add at least one file or embed a product before publishing');
    });

    it('should allow publishing with files', async () => {
      vi.mocked(products.getProductFiles).mockResolvedValue([
        { id: 'file-1', title: 'Test File' },
      ] as any);
      vi.mocked(products.getProductComponents).mockResolvedValue([]);
      vi.mocked(products.getProductDocuments).mockResolvedValue([]);
      vi.mocked(products.getProductImages).mockResolvedValue([{ id: 'img-1' }] as any);

      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        status: 'public',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          status: 'public',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(200);
    });

    it('should allow publishing with embedded components', async () => {
      vi.mocked(products.getProductFiles).mockResolvedValue([]);
      vi.mocked(products.getProductComponents).mockResolvedValue([
        { id: 'comp-1', child_product_id: VALID_CHILD_PRODUCT_ID },
      ] as any);
      vi.mocked(products.getProductDocuments).mockResolvedValue([]);
      vi.mocked(products.getProductImages).mockResolvedValue([{ id: 'img-1' }] as any);

      // Mock product calls - getProductById is called 3 times:
      // 1. Ownership check (line 126)
      // 2. Validation - get parent product (line 39)
      // 3. Validation - get child product (line 63)
      vi.mocked(products.getProductById)
        .mockResolvedValueOnce({
          id: VALID_PRODUCT_ID,
          user_id: 'user-123',
          title: 'Test Product',
          description: 'A test product with sufficient description',
          status: 'draft',
        } as any)
        .mockResolvedValueOnce({
          id: VALID_PRODUCT_ID,
          user_id: 'user-123',
          title: 'Test Product',
          description: 'A test product with sufficient description',
          status: 'draft',
        } as any)
        .mockResolvedValueOnce({
          id: VALID_CHILD_PRODUCT_ID,
          title: 'Child Product',
          status: 'public', // Allowed for publishing
        } as any);

      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        status: 'public',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          status: 'public',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(200);
    });

    it('should reject publishing if embedded product is draft', async () => {
      vi.mocked(products.getProductFiles).mockResolvedValue([]);
      vi.mocked(products.getProductComponents).mockResolvedValue([
        { id: 'comp-1', child_product_id: VALID_CHILD_PRODUCT_ID },
      ] as any);
      vi.mocked(products.getProductDocuments).mockResolvedValue([]);
      vi.mocked(products.getProductImages).mockResolvedValue([]);

      // Mock product calls - getProductById is called 3 times:
      // 1. Ownership check
      // 2. Validation - get parent product
      // 3. Validation - get child product
      vi.mocked(products.getProductById)
        .mockResolvedValueOnce({
          id: VALID_PRODUCT_ID,
          user_id: 'user-123',
          title: 'Test Product',
          description: 'A test product',
          status: 'draft',
        } as any)
        .mockResolvedValueOnce({
          id: VALID_PRODUCT_ID,
          user_id: 'user-123',
          title: 'Test Product',
          description: 'A test product',
          status: 'draft',
        } as any)
        .mockResolvedValueOnce({
          id: VALID_CHILD_PRODUCT_ID,
          title: 'Child Product',
          status: 'draft', // Not allowed - embedded products must be private or public
        } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          status: 'public',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Child Product');
      expect(data.error).toContain('must be private or published');
    });

    it('should not validate publish requirements for draft status', async () => {
      // No files, but staying in draft - should be allowed
      vi.mocked(products.getProductFiles).mockResolvedValue([]);
      vi.mocked(products.getProductComponents).mockResolvedValue([]);

      vi.mocked(products.updateProduct).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        status: 'draft',
      } as any);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          status: 'draft',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(200);
      // getProductFiles should not have been called (no validation)
      expect(products.getProductFiles).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if updateProduct returns null', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'user-123',
        title: 'Test Product',
      } as any);

      vi.mocked(products.updateProduct).mockResolvedValue(null);

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to update product');
    });

    it('should return 500 if updateProduct throws error', async () => {
      vi.mocked(products.getProductById).mockResolvedValue({
        id: VALID_PRODUCT_ID,
        user_id: 'user-123',
        title: 'Test Product',
      } as any);

      vi.mocked(products.updateProduct).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: VALID_PRODUCT_ID,
          title: 'Updated Title',
        }),
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database error');
    });

    it('should handle malformed JSON gracefully', async () => {
      mockRequest = new Request('http://localhost/api/products/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      const response = await PUT({
        request: mockRequest,
        cookies: mockCookies,
      } as any);

      expect(response.status).toBe(500);
    });
  });
});
