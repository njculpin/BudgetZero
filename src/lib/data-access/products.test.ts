import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkHandleAvailability,
  createProduct,
  updateProduct,
  getProductById,
} from './products';
import { serverClient } from './client';
import type { CreateProductParams, UpdateProductParams } from './products';

// Mock the serverClient
vi.mock('./client', () => ({
  serverClient: {
    from: vi.fn(),
  },
}));

describe('Product Handle Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkHandleAvailability', () => {
    it('should return true when handle is available', async () => {
      // Create a query builder that chains properly
      const finalPromise = Promise.resolve({ data: [], error: null });
      const mockEq2 = vi.fn(() => finalPromise);
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      const mockFrom = vi.fn(() => ({ select: mockSelect }));

      vi.mocked(serverClient.from).mockImplementation(mockFrom as never);

      const result = await checkHandleAvailability('my-unique-handle');

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('products');
    });

    it('should return false when handle is taken', async () => {
      const finalPromise = Promise.resolve({
        data: [{ id: 'existing-product-id' }],
        error: null,
      });
      const mockEq2 = vi.fn(() => finalPromise);
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      const mockFrom = vi.fn(() => ({ select: mockSelect }));

      vi.mocked(serverClient.from).mockImplementation(mockFrom as never);

      const result = await checkHandleAvailability('taken-handle');

      expect(result).toBe(false);
    });

    it('should exclude current product when checking availability', async () => {
      const finalPromise = Promise.resolve({ data: [], error: null });
      const mockNeq = vi.fn(() => finalPromise);
      const mockEq2 = vi.fn(() => ({ neq: mockNeq }));
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      const mockFrom = vi.fn(() => ({ select: mockSelect }));

      vi.mocked(serverClient.from).mockImplementation(mockFrom as never);

      const result = await checkHandleAvailability('my-handle', 'current-product-id');

      expect(result).toBe(true);
      expect(mockNeq).toHaveBeenCalledWith('id', 'current-product-id');
    });

    it('should return false on database error', async () => {
      const finalPromise = Promise.resolve({
        data: null,
        error: { message: 'Database error' },
      });
      const mockEq2 = vi.fn(() => finalPromise);
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      const mockFrom = vi.fn(() => ({ select: mockSelect }));

      vi.mocked(serverClient.from).mockImplementation(mockFrom as never);

      const result = await checkHandleAvailability('error-handle');

      expect(result).toBe(false);
    });
  });

  describe('createProduct', () => {
    it('should create product with sanitized handle from title', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // Mock handle availability check
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as never
      );

      // Mock insert
      vi.mocked(serverClient.from).mockReturnValueOnce(mockQuery as never);
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'new-product-id',
          handle: 'my-awesome-game',
          title: 'My Awesome Game!',
          description: 'A great game',
          status: 'draft',
          user_id: 'user-123',
          view_count: 0,
        },
        error: null,
      });

      const params: CreateProductParams = {
        title: 'My Awesome Game!',
        description: 'A great game',
        status: 'draft',
      };

      const result = await createProduct('user-123', params);

      expect(result).toBeDefined();
      expect(result?.handle).toBe('my-awesome-game');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          handle: 'my-awesome-game',
          title: 'My Awesome Game!',
          description: 'A great game',
          status: 'draft',
          view_count: 0,
        })
      );
    });

    it('should handle special characters in title when generating handle', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // Mock handle availability
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as never
      );

      // Mock insert
      vi.mocked(serverClient.from).mockReturnValueOnce(mockQuery as never);
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'new-product-id',
          handle: 'game-with-special-chars',
          title: 'Game @#$ with Special % Chars!!!',
          description: '',
          status: 'draft',
          user_id: 'user-123',
        },
        error: null,
      });

      const params: CreateProductParams = {
        title: 'Game @#$ with Special % Chars!!!',
      };

      const result = await createProduct('user-123', params);

      expect(result?.handle).toBe('game-with-special-chars');
    });

    it('should truncate handle to 50 characters', async () => {
      const longTitle = 'A'.repeat(100);
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // Mock handle availability
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as never
      );

      // Mock insert
      vi.mocked(serverClient.from).mockReturnValueOnce(mockQuery as never);
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'new-product-id',
          handle: 'a'.repeat(50),
          title: longTitle,
          description: '',
          status: 'draft',
          user_id: 'user-123',
        },
        error: null,
      });

      const params: CreateProductParams = {
        title: longTitle,
      };

      const result = await createProduct('user-123', params);

      expect(result?.handle.length).toBeLessThanOrEqual(50);
    });

    it('should handle collision by appending -1 suffix', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // First check: handle taken
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'existing-id' }],
              error: null,
            }),
          }),
        } as never
      );

      // Second check: handle-1 available
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as never
      );

      // Mock insert
      vi.mocked(serverClient.from).mockReturnValueOnce(mockQuery as never);
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'new-product-id',
          handle: 'duplicate-title-1',
          title: 'Duplicate Title',
          description: '',
          status: 'draft',
          user_id: 'user-123',
        },
        error: null,
      });

      const params: CreateProductParams = {
        title: 'Duplicate Title',
      };

      const result = await createProduct('user-123', params);

      expect(result?.handle).toBe('duplicate-title-1');
    });

    it('should return null on database error', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // Mock handle availability
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as never
      );

      // Mock insert error
      vi.mocked(serverClient.from).mockReturnValueOnce(mockQuery as never);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const params: CreateProductParams = {
        title: 'Test Product',
      };

      const result = await createProduct('user-123', params);

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update product and regenerate handle from new title', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      };

      // Mock handle availability check
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        } as never
      );

      // Mock update
      vi.mocked(serverClient.from).mockReturnValueOnce(mockUpdateQuery as never);
      mockUpdateQuery.eq.mockResolvedValue({ error: null });

      // Mock getProductById
      vi.mocked(serverClient.from).mockReturnValueOnce(mockSelectQuery as never);
      mockSelectQuery.single.mockResolvedValue({
        data: {
          id: 'product-123',
          handle: 'updated-title',
          title: 'Updated Title',
          description: 'Updated description',
          status: 'draft',
        },
        error: null,
      });

      const updates: UpdateProductParams = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const result = await updateProduct('product-123', updates);

      expect(result).toBeDefined();
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated description',
          handle: 'updated-title',
        })
      );
    });

    it('should throw error when custom handle is already taken', async () => {
      // Mock handle unavailable
      vi.mocked(serverClient.from).mockReturnValueOnce(
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({
                data: [{ id: 'other-product-id' }],
                error: null,
              }),
            }),
          }),
        } as never
      );

      const updates: UpdateProductParams = {
        handle: 'taken-handle',
      };

      await expect(updateProduct('product-123', updates)).rejects.toThrow(
        'Handle is already taken'
      );
    });

    it('should update status without changing handle', async () => {
      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      };

      const mockSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // Mock update
      vi.mocked(serverClient.from).mockReturnValueOnce(mockUpdateQuery as never);
      mockUpdateQuery.eq.mockResolvedValue({ error: null });

      // Mock getProductById
      vi.mocked(serverClient.from).mockReturnValueOnce(mockSelectQuery as never);
      mockSelectQuery.single.mockResolvedValue({
        data: {
          id: 'product-123',
          handle: 'original-handle',
          title: 'Original Title',
          status: 'public',
        },
        error: null,
      });

      const updates: UpdateProductParams = {
        status: 'public',
      };

      const result = await updateProduct('product-123', updates);

      expect(result?.status).toBe('public');
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          handle: expect.anything(),
        })
      );
    });
  });
});
