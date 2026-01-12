/**
 * OAuth Callback Endpoint Tests
 *
 * Tests for /api/auth/callback (GET)
 *
 * Coverage:
 * - Successful OAuth callback with code exchange
 * - Missing code parameter → 400 error
 * - Failed code exchange → 500 error
 * - Cookie setting after successful exchange
 * - Redirect to products page
 * - Cookie security attributes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../callback';
import * as auth from '@/lib/auth';

// Mock auth module
vi.mock('@/lib/auth');

describe('GET /api/auth/callback', () => {
  let mockUrl: URL;
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

  describe('Successful OAuth Callback', () => {
    it('should exchange code for session and set cookies', async () => {
      const authCode = 'oauth_code_abc123';
      mockUrl = new URL(`http://localhost/api/auth/callback?code=${authCode}`);

      const mockSession = {
        access_token: 'oauth-access-token',
        refresh_token: 'oauth-refresh-token',
      };

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'oauth-user-1', email: 'oauth@example.com' },
          session: mockSession,
        },
        error: null,
      } as any);

      const response = await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Verify exchangeCodeForSession was called
      expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(authCode);

      // Verify cookies were set
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'oauth-access-token',
        expect.objectContaining({
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      );

      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'oauth-refresh-token',
        expect.objectContaining({
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      );

      // Verify redirect to products
      expect(mockRedirect).toHaveBeenCalledWith('/products', 303);
    });

    it('should handle code from different OAuth providers', async () => {
      const googleCode = 'google_oauth_code_xyz';
      mockUrl = new URL(`http://localhost/api/auth/callback?code=${googleCode}`);

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'google-user', email: 'google@gmail.com' },
          session: {
            access_token: 'google-token',
            refresh_token: 'google-refresh',
          },
        },
        error: null,
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(googleCode);
      expect(mockCookies.set).toHaveBeenCalledTimes(2);
      expect(mockRedirect).toHaveBeenCalledWith('/products', 303);
    });

    it('should set both access and refresh tokens', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=testcode');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: {
            access_token: 'access123',
            refresh_token: 'refresh123',
          },
        },
        error: null,
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Verify both cookies were set
      expect(mockCookies.set).toHaveBeenCalledTimes(2);

      const cookieCalls = mockCookies.set.mock.calls;
      const cookieNames = cookieCalls.map((call: any) => call[0]);
      expect(cookieNames).toContain('sb-access-token');
      expect(cookieNames).toContain('sb-refresh-token');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when code parameter is missing', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback');

      const response = await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('No code provided');

      // Verify exchangeCodeForSession was not called
      expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();

      // Verify no cookies were set
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('should return 400 when code parameter is empty', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=');

      const response = await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(400);
      expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('should handle URL with other query parameters', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=valid123&state=abc&redirect=/custom');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
          },
        },
        error: null,
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Should extract code correctly despite other parameters
      expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('valid123');
    });
  });

  describe('Exchange Errors', () => {
    it('should return 500 when code exchange fails', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=invalid_code');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid authorization code',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const response = await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Invalid authorization code');

      // Verify no cookies were set
      expect(mockCookies.set).not.toHaveBeenCalled();

      // Verify no redirect occurred
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should return 500 for expired authorization code', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=expired_code');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Authorization code expired',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const response = await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Authorization code expired');

      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('should return 500 for network/service errors', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=testcode');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Unable to reach authentication service',
          name: 'NetworkError',
          status: 500,
        },
      } as any);

      const response = await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(500);
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('Cookie Security', () => {
    it('should set cookies with correct security attributes', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=testcode');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: {
            access_token: 'access',
            refresh_token: 'refresh',
          },
        },
        error: null,
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Verify access token cookie
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'access',
        expect.objectContaining({
          path: '/',
          sameSite: 'lax',
          maxAge: 604800, // 7 days in seconds
        })
      );

      // Verify refresh token cookie
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'refresh',
        expect.objectContaining({
          path: '/',
          sameSite: 'lax',
          maxAge: 604800, // 7 days in seconds
        })
      );
    });

    it('should set cookies with path accessible from all routes', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=testcode');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
          },
        },
        error: null,
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Both cookies should have path: '/'
      const accessTokenCall = mockCookies.set.mock.calls.find(
        (call: any) => call[0] === 'sb-access-token'
      );
      const refreshTokenCall = mockCookies.set.mock.calls.find(
        (call: any) => call[0] === 'sb-refresh-token'
      );

      expect(accessTokenCall[2].path).toBe('/');
      expect(refreshTokenCall[2].path).toBe('/');
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to /products with 303 status', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=testcode');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
          },
        },
        error: null,
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(mockRedirect).toHaveBeenCalledWith('/products', 303);
    });

    it('should not redirect if code exchange fails', async () => {
      mockUrl = new URL('http://localhost/api/auth/callback?code=badcode');

      vi.mocked(auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid code',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      await GET({
        url: mockUrl,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
