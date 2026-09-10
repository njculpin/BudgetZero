import { makeContext } from '@gameloopers/api/test-support';
/**
 * Complete Onboarding Endpoint Tests
 *
 * Tests for /api/users/complete-onboarding (POST)
 *
 * Coverage:
 * - Authentication required
 * - Onboarding completion
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usersCompleteOnboarding } from '@gameloopers/api/controllers/users/complete-onboarding';
import * as auth from '@gameloopers/core/auth';
import * as users from '@gameloopers/core/data-access/users';

// Mock modules
vi.mock('@gameloopers/core/auth');
vi.mock('@gameloopers/core/data-access/users');

describe('POST /api/users/complete-onboarding', () => {
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
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token', refresh_token: 'refresh' },
      },
      error: null,
    } as any);

    mockRequest = new Request('http://localhost/api/users/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    // Token verification, expiry and refresh belong to the gateway and are
    // tested once in gateway.test.ts. This is the controller's own decision.
    it('rejects a caller who is not signed in', async () => {
      const response = await usersCompleteOnboarding(makeContext({ userId: null, body: {} }));

      expect(response.status).toBe(401);
    });
  });

  describe('Onboarding Completion', () => {
    it('should successfully complete onboarding', async () => {
      vi.mocked(users.completeOnboarding).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        handle: 'testuser',
        onboarding_completed: true,
        credits_balance: 0,
      } as any);

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.onboarding_completed).toBe(true);
      expect(users.completeOnboarding).toHaveBeenCalledWith('user-123');
    });

    it('should return 500 when completeOnboarding returns null', async () => {
      vi.mocked(users.completeOnboarding).mockResolvedValue(null);

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to complete onboarding');
    });

    it('should use the authenticated user ID', async () => {
      // The caller's identity comes from the context, not from a mocked session.
      vi.mocked(users.completeOnboarding).mockResolvedValue({
        id: 'different-user-456',
        email: 'other@example.com',
        onboarding_completed: true,
      } as any);

      await usersCompleteOnboarding(
        makeContext({ request: mockRequest, userId: 'different-user-456' })
      );

      expect(users.completeOnboarding).toHaveBeenCalledWith('different-user-456');
    });

    it('should return updated user data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        handle: 'testuser',
        name: 'Test User',
        onboarding_completed: true,
        credits_balance: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      vi.mocked(users.completeOnboarding).mockResolvedValue(mockUser as any);

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(users.completeOnboarding).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should handle generic errors', async () => {
      vi.mocked(users.completeOnboarding).mockRejectedValue('Unexpected error');

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');

      vi.mocked(users.completeOnboarding).mockRejectedValue(testError);

      await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in complete-onboarding:', testError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    it('should return JSON with correct Content-Type', async () => {
      vi.mocked(users.completeOnboarding).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        onboarding_completed: true,
      } as any);

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return success object with user data on success', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        onboarding_completed: true,
      };

      vi.mocked(users.completeOnboarding).mockResolvedValue(mockUser as any);

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
      expect(data.user).toEqual(mockUser);
    });

    it('should return error object on failure', async () => {
      vi.mocked(users.completeOnboarding).mockResolvedValue(null);

      const response = await usersCompleteOnboarding(makeContext({ request: mockRequest }));

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).not.toHaveProperty('success');
      expect(data).not.toHaveProperty('user');
    });
  });
});
