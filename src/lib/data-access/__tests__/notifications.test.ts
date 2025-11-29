/**
 * Unit Tests: Notification Data Access Layer
 *
 * Tests all notification-related database operations
 * Mocks the Supabase client to test isolation layer behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  resolveProductConflict,
  getProductsNeedingAttention,
} from '../notifications';
import type { Notification, NotificationSettings } from '@/types';

// Mock the database client
vi.mock('../../database/client', () => ({
  createClient: vi.fn(),
}));

describe('Notification Data Access Layer', () => {
  let mockClient: {
    from: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mock client for each test
    mockClient = {
      from: vi.fn(),
      rpc: vi.fn(),
    };

    // Setup the mock to return our mock client
    const { createClient } = await import('../../database/client');
    vi.mocked(createClient).mockResolvedValue(mockClient as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications for valid user with default pagination', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          title: 'Asset Price Changed',
          message: 'Asset "Test Model" price updated',
          entity_type: 'asset',
          entity_id: 'asset-1',
          action_type: 'asset_price_changed',
          snapshot: { asset_handle: 'test-model' },
          delivery_type: 'inapp',
          read: false,
          read_at: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          deleted: false,
          deleted_at: null,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotifications('user-1');

      expect(mockClient.from).toHaveBeenCalledWith('notifications');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted', false);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 49); // Default limit 50
      expect(result).toEqual(mockNotifications);
    });

    it('should respect custom pagination limits', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      await getNotifications('user-1', 10, 20);

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29); // offset 20, limit 10
    });

    it('should return empty array when user has no notifications', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotifications('user-no-notifications');

      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotifications('user-1');

      expect(result).toEqual([]);
    });

    it('should handle null data from database gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotifications('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should fetch only unread notifications', async () => {
      const mockUnreadNotifications: Notification[] = [
        {
          id: 'notif-unread',
          user_id: 'user-1',
          title: 'New Sale',
          message: 'Product purchased',
          entity_type: 'sale',
          entity_id: 'sale-1',
          action_type: 'sale_completed',
          snapshot: {},
          delivery_type: 'inapp',
          read: false,
          read_at: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          deleted: false,
          deleted_at: null,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockUnreadNotifications, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getUnreadNotifications('user-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('read', false);
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted', false);
      expect(result).toEqual(mockUnreadNotifications);
    });

    it('should return empty array when no unread notifications', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getUnreadNotifications('user-all-read');

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should count unread notifications correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        // Note: count query returns count, not data
      };
      mockQuery.eq.mockResolvedValue({ count: 5, error: null });

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getUnreadNotificationCount('user-1');

      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('read', false);
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted', false);
      expect(result).toBe(5);
    });

    it('should return 0 when user has no unread notifications', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockQuery.eq.mockResolvedValue({ count: 0, error: null });

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getUnreadNotificationCount('user-no-unread');

      expect(result).toBe(0);
    });

    it('should return 0 on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockQuery.eq.mockResolvedValue({
        count: null,
        error: { message: 'Count failed' }
      });

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getUnreadNotificationCount('user-1');

      expect(result).toBe(0);
    });

    it('should handle null count gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockQuery.eq.mockResolvedValue({ count: null, error: null });

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getUnreadNotificationCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('getNotificationById', () => {
    it('should fetch notification by ID successfully', async () => {
      const mockNotification: Notification = {
        id: 'notif-1',
        user_id: 'user-1',
        title: 'Test Notification',
        message: 'Test message',
        entity_type: 'product',
        entity_id: 'product-1',
        action_type: 'product_price_conflict',
        snapshot: { product_handle: 'test-product' },
        delivery_type: 'inapp',
        read: false,
        read_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotificationById('notif-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'notif-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted', false);
      expect(result).toEqual(mockNotification);
    });

    it('should return null for non-existent notification', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // Not found error
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotificationById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' }
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotificationById('notif-1');

      expect(result).toBeNull();
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await markNotificationAsRead('notif-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          read: true,
          read_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'notif-1');
      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await markNotificationAsRead('notif-1');

      expect(result).toBe(false);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockQuery.eq.mockResolvedValue({ error: null });

      mockClient.from.mockReturnValue(mockQuery);

      const result = await markAllNotificationsAsRead('user-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          read: true,
          read_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('read', false);
      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockQuery.eq.mockResolvedValue({ error: { message: 'Bulk update failed' } });

      mockClient.from.mockReturnValue(mockQuery);

      const result = await markAllNotificationsAsRead('user-1');

      expect(result).toBe(false);
    });
  });

  describe('deleteNotification', () => {
    it('should soft delete notification successfully', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await deleteNotification('notif-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted: true,
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'notif-1');
      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await deleteNotification('notif-1');

      expect(result).toBe(false);
    });
  });

  describe('getNotificationSettings', () => {
    it('should fetch notification settings for user', async () => {
      const mockSettings: NotificationSettings = {
        id: 'settings-1',
        user_id: 'user-1',
        email_asset_changes: true,
        email_product_conflicts: true,
        email_sales: true,
        email_royalty_payments: true,
        email_document_shares: true,
        email_jam_updates: false,
        email_marketing: false,
        inapp_asset_changes: true,
        inapp_product_conflicts: true,
        inapp_sales: true,
        inapp_royalty_payments: true,
        inapp_document_shares: true,
        inapp_jam_updates: true,
        push_enabled: false,
        push_sales: false,
        push_royalty_payments: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotificationSettings('user-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockSettings);
    });

    it('should create default settings when none exist', async () => {
      const mockDefaultSettings: NotificationSettings = {
        id: 'settings-new',
        user_id: 'user-new',
        email_asset_changes: true,
        email_product_conflicts: true,
        email_sales: true,
        email_royalty_payments: true,
        email_document_shares: true,
        email_jam_updates: false,
        email_marketing: false,
        inapp_asset_changes: true,
        inapp_product_conflicts: true,
        inapp_sales: true,
        inapp_royalty_payments: true,
        inapp_document_shares: true,
        inapp_jam_updates: true,
        push_enabled: false,
        push_sales: false,
        push_royalty_payments: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // First query returns PGRST116 (not found)
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        }),
      };

      // Second query (insert) returns new settings
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDefaultSettings, error: null }),
      };

      // Mock different return values for sequential calls
      mockClient.from
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await getNotificationSettings('user-new');

      expect(result).toEqual(mockDefaultSettings);
    });

    it('should return null on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' }
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotificationSettings('user-1');

      expect(result).toBeNull();
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      const updatedSettings: NotificationSettings = {
        id: 'settings-1',
        user_id: 'user-1',
        email_asset_changes: false, // Changed
        email_product_conflicts: true,
        email_sales: true,
        email_royalty_payments: true,
        email_document_shares: true,
        email_jam_updates: true, // Changed
        email_marketing: false,
        inapp_asset_changes: true,
        inapp_product_conflicts: true,
        inapp_sales: true,
        inapp_royalty_payments: true,
        inapp_document_shares: true,
        inapp_jam_updates: true,
        push_enabled: false,
        push_sales: false,
        push_royalty_payments: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedSettings, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await updateNotificationSettings('user-1', {
        email_asset_changes: false,
        email_jam_updates: true,
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        email_asset_changes: false,
        email_jam_updates: true,
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(updatedSettings);
    });

    it('should return null on database error', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await updateNotificationSettings('user-1', {
        email_marketing: true,
      });

      expect(result).toBeNull();
    });
  });

  describe('resolveProductConflict', () => {
    it('should resolve product conflict successfully', async () => {
      mockClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null
      });

      const result = await resolveProductConflict('product-1', 'user-1');

      expect(mockClient.rpc).toHaveBeenCalledWith('resolve_product_conflict', {
        p_product_id: 'product-1',
        p_user_id: 'user-1',
      });
      expect(result).toEqual({ success: true });
    });

    it('should return error when user is not product owner', async () => {
      mockClient.rpc.mockResolvedValue({
        data: { success: false, error: 'Unauthorized' },
        error: null
      });

      const result = await resolveProductConflict('product-1', 'wrong-user');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should handle database error gracefully', async () => {
      mockClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC call failed' }
      });

      const result = await resolveProductConflict('product-1', 'user-1');

      expect(result).toEqual({
        success: false,
        error: 'RPC call failed'
      });
    });

    it('should handle product not found', async () => {
      mockClient.rpc.mockResolvedValue({
        data: { success: false, error: 'Product not found' },
        error: null
      });

      const result = await resolveProductConflict('non-existent', 'user-1');

      expect(result).toEqual({
        success: false,
        error: 'Product not found'
      });
    });
  });

  describe('getProductsNeedingAttention', () => {
    it('should fetch products needing attention for user', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Test Product',
          handle: 'test-product',
          attention_reason: 'Asset price increased, product price now below cost',
          attention_since: '2025-01-01T00:00:00Z',
        },
        {
          id: 'product-2',
          title: 'Another Product',
          handle: 'another-product',
          attention_reason: 'Asset files changed, please review',
          attention_since: '2025-01-01T01:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getProductsNeedingAttention('user-1');

      expect(mockQuery.select).toHaveBeenCalledWith(
        'id, title, handle, attention_reason, attention_since'
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('needs_attention', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted', false);
      expect(mockQuery.order).toHaveBeenCalledWith('attention_since', { ascending: false });
      expect(result).toEqual(mockProducts);
    });

    it('should return empty array when no products need attention', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getProductsNeedingAttention('user-no-conflicts');

      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' }
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getProductsNeedingAttention('user-1');

      expect(result).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getProductsNeedingAttention('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent notification marking', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      // Simulate concurrent reads
      const [result1, result2, result3] = await Promise.all([
        markNotificationAsRead('notif-1'),
        markNotificationAsRead('notif-2'),
        markNotificationAsRead('notif-3'),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledTimes(3);
    });

    it('should handle very large notification lists', async () => {
      const mockLargeList = Array.from({ length: 1000 }, (_, i) => ({
        id: `notif-${i}`,
        user_id: 'user-1',
        title: `Notification ${i}`,
        message: 'Test',
        entity_type: 'product' as const,
        entity_id: 'product-1',
        action_type: 'general' as const,
        snapshot: {},
        delivery_type: 'inapp' as const,
        read: false,
        read_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }));

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockLargeList, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotifications('user-1', 1000);

      expect(result).toHaveLength(1000);
    });

    it('should handle special characters in user IDs', async () => {
      const specialUserId = 'user-with-special-chars-!@#$%';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await getNotifications(specialUserId);

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', specialUserId);
      expect(result).toEqual([]);
    });

    it('should handle network timeout gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockRejectedValue(new Error('Network timeout')),
      };

      mockClient.from.mockReturnValue(mockQuery);

      // Should not throw, but return empty array or handle error
      await expect(async () => {
        await getNotifications('user-1');
      }).rejects.toThrow('Network timeout');
    });
  });
});
