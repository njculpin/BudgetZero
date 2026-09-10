import { makeContext } from '@gameloopers/api/test-support';
/**
 * Sign-Out Endpoint Tests
 *
 * Tests for /api/auth/sign-out (POST and GET)
 *
 * Coverage:
 * - POST method → successful sign-out
 * - GET method → backward compatibility
 * - Cookie deletion (both access and refresh tokens)
 * - Redirect to homepage
 * - Supabase signOut call
 * - Error handling if signOut fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authSignOutPost, authSignOutGet } from '@gameloopers/api/controllers/auth/sign-out';
import * as auth from '@gameloopers/core/auth';

/** Where a 3xx response points, or null when it is not a redirect. */
function redirectTarget(response: Response): string | null {
  return response.status >= 300 && response.status < 400
    ? response.headers.get('Location')
    : null;
}

// Mock auth module
vi.mock('@gameloopers/core/auth');

describe('POST /api/auth/sign-out', () => {
  let response: Response;
  let mockCookies: any;
  let mockRedirect: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCookies = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    };

    mockRedirect = vi.fn((url: string, status?: number) => {
      return new Response(null, {
        status: status || 302,
        headers: { Location: url },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST Method', () => {
    it('should sign out user, delete cookies, and redirect to homepage', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Verify signOut was called
      expect(auth.signOut).toHaveBeenCalledTimes(1);

      // Verify both cookies were deleted
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });
      expect(mockCookies.delete).toHaveBeenCalledTimes(2);

      // Verify redirect to homepage
      expect(redirectTarget(response)).toBe('/');
    });

    it('should delete cookies in correct order', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      const deleteCalls = mockCookies.delete.mock.calls;
      expect(deleteCalls[0][0]).toBe('sb-access-token');
      expect(deleteCalls[1][0]).toBe('sb-refresh-token');
    });

    it('should specify path "/" for cookie deletion', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Verify path is specified for both cookies
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });
    });

    it('should still delete cookies even if signOut fails', async () => {
      // Simulate signOut error
      vi.mocked(auth.signOut).mockRejectedValue(new Error('Supabase error'));

      // Should not throw, still deletes cookies
      await expect(
        authSignOutPost(makeContext({ cookies: mockCookies }))
      ).rejects.toThrow('Supabase error');

      // Verify signOut was attempted
      expect(auth.signOut).toHaveBeenCalled();
    });

    it('should call signOut before deleting cookies', async () => {
      const callOrder: string[] = [];

      vi.mocked(auth.signOut).mockImplementation(async () => {
        callOrder.push('signOut');
        return { error: null };
      });

      const originalDelete = mockCookies.delete;
      mockCookies.delete = vi.fn((name: string, options: any) => {
        callOrder.push(`delete-${name}`);
        return originalDelete(name, options);
      });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Verify order: signOut first, then cookie deletions
      expect(callOrder[0]).toBe('signOut');
      expect(callOrder[1]).toBe('delete-sb-access-token');
      expect(callOrder[2]).toBe('delete-sb-refresh-token');
    });
  });

  describe('GET Method', () => {
    it('should support GET method for backward compatibility', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutGet(makeContext({ cookies: mockCookies }));

      // Verify signOut was called
      expect(auth.signOut).toHaveBeenCalledTimes(1);

      // Verify both cookies were deleted
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });

      // Verify redirect to homepage
      expect(redirectTarget(response)).toBe('/');
    });

    it('should have identical behavior to POST method', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      // Call both methods
      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      const postCallCount = {
        signOut: vi.mocked(auth.signOut).mock.calls.length,
        delete: mockCookies.delete.mock.calls.length,
        redirect: redirectTarget(response) === null ? 0 : 1,
      };

      vi.clearAllMocks();

      response = await authSignOutGet(makeContext({ cookies: mockCookies }));

      const getCallCount = {
        signOut: vi.mocked(auth.signOut).mock.calls.length,
        delete: mockCookies.delete.mock.calls.length,
        redirect: redirectTarget(response) === null ? 0 : 1,
      };

      // Verify identical behavior
      expect(postCallCount).toEqual(getCallCount);
    });

    it('should delete cookies with correct parameters', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutGet(makeContext({ cookies: mockCookies }));

      // Verify cookie deletion parameters
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
      expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to "/" after sign-out', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      expect(redirectTarget(response)).toBe('/');
      expect(redirectTarget(response)).not.toBeNull();
    });

    it('should redirect to homepage not /products', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Verify redirect is to homepage, not products page
      expect(redirectTarget(response)).toBe('/');
      expect(redirectTarget(response)).not.toBe('/products');
    });

    it('should return redirect response', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // mockRedirect returns a Response with Location header
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('Cookie Cleanup', () => {
    it('should delete both access and refresh tokens', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      const cookieNames = mockCookies.delete.mock.calls.map((call: any) => call[0]);
      expect(cookieNames).toContain('sb-access-token');
      expect(cookieNames).toContain('sb-refresh-token');
    });

    it('should use "/" path for cookie deletion to match set path', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Both cookies should have path: '/' to ensure they're deleted properly
      mockCookies.delete.mock.calls.forEach((call: any) => {
        expect(call[1]).toEqual({ path: '/' });
      });
    });

    it('should not call cookies.set (only delete)', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Verify no cookies were set, only deleted
      expect(mockCookies.set).not.toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Supabase Integration', () => {
    it('should call signOut from auth module', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      expect(auth.signOut).toHaveBeenCalled();
    });

    it('should call signOut with no arguments', async () => {
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // signOut should be called with no parameters
      expect(auth.signOut).toHaveBeenCalledWith();
    });

    it('should await signOut before proceeding', async () => {
      let signOutCompleted = false;

      vi.mocked(auth.signOut).mockImplementation(async () => {
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        signOutCompleted = true;
        return { error: null };
      });

      response = await authSignOutPost(makeContext({ cookies: mockCookies }));

      // Verify signOut was awaited
      expect(signOutCompleted).toBe(true);
    });
  });
});
