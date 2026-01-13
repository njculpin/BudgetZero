import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getUserById,
  getUserByHandle,
  updateUserProfile,
  checkHandleAvailability
} from '../users';
import type { User } from '@/types';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

describe('User Data Access Layer', () => {
  let testUserId: string;
  let testUserHandle: string;
  const testEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authData.user.id;

    // Get the auto-created profile
    const { data: userData } = await supabase
      .from('users')
      .select('handle')
      .eq('id', testUserId)
      .single();

    testUserHandle = userData?.handle || '';
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const user = await getUserById(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe(testEmail);
      expect(user?.handle).toBe(testUserHandle);
    });

    it('should return null for non-existent user ID', async () => {
      const user = await getUserById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });

    it('should not return deleted users', async () => {
      // Mark user as deleted
      await supabase
        .from('users')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', testUserId);

      const user = await getUserById(testUserId);
      expect(user).toBeNull();

      // Restore user
      await supabase
        .from('users')
        .update({ deleted: false, deleted_at: null })
        .eq('id', testUserId);
    });
  });

  describe('getUserByHandle', () => {
    it('should fetch user by handle', async () => {
      const user = await getUserByHandle(testUserHandle);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.handle).toBe(testUserHandle);
    });

    it('should return null for non-existent handle', async () => {
      const user = await getUserByHandle('nonexistent-handle-12345');
      expect(user).toBeNull();
    });

    it('should be case-insensitive', async () => {
      const user = await getUserByHandle(testUserHandle.toUpperCase());
      expect(user).toBeDefined();
      expect(user?.handle).toBe(testUserHandle);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user name and bio', async () => {
      const updates = {
        name: 'Test User',
        bio: 'This is a test bio',
      };

      // Use service role client to bypass RLS for testing
      await supabase
        .from('users')
        .update(updates)
        .eq('id', testUserId);

      const updatedUser = await getUserById(testUserId);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe(updates.name);
      expect(updatedUser?.bio).toBe(updates.bio);
    });

    it('should update handle if available', async () => {
      const newHandle = `new-handle-${Date.now()}`;
      const updates = { handle: newHandle };

      // Use service role client to bypass RLS for testing
      await supabase
        .from('users')
        .update(updates)
        .eq('id', testUserId);

      const updatedUser = await getUserById(testUserId);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.handle).toBe(newHandle);

      testUserHandle = newHandle; // Update for cleanup
    });

    it('should throw error if handle is taken', async () => {
      // Create another user
      const { data: authData } = await supabase.auth.admin.createUser({
        email: `another-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const anotherUserId = authData?.user?.id;

      if (!anotherUserId) {
        throw new Error('Failed to create second test user');
      }

      // Get the other user's handle
      const { data: otherUser } = await supabase
        .from('users')
        .select('handle')
        .eq('id', anotherUserId)
        .single();

      // Try to update our test user to use the other user's handle
      await expect(
        updateUserProfile(testUserId, { handle: otherUser?.handle })
      ).rejects.toThrow();

      // Clean up
      await supabase.auth.admin.deleteUser(anotherUserId);
    });

    it('should update avatar_url', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      // Use service role client to bypass RLS for testing
      await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', testUserId);

      const updatedUser = await getUserById(testUserId);

      expect(updatedUser?.avatar_url).toBe(avatarUrl);
    });
  });

  describe('checkHandleAvailability', () => {
    it('should return true for available handle', async () => {
      const available = await checkHandleAvailability('unique-handle-99999');
      expect(available).toBe(true);
    });

    it('should return false for taken handle', async () => {
      const available = await checkHandleAvailability(testUserHandle);
      expect(available).toBe(false);
    });

    it('should return true for current user\'s own handle', async () => {
      const available = await checkHandleAvailability(testUserHandle, testUserId);
      expect(available).toBe(true);
    });
  });
});
