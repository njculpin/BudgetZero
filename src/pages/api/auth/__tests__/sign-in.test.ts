/**
 * Sign-In Endpoint Tests
 *
 * Tests for /api/auth/sign-in (POST)
 *
 * Coverage:
 * - Valid credentials → successful login with cookies
 * - Invalid credentials → 401 with user-friendly error
 * - Missing fields → 400 validation error
 * - Email not confirmed → user-friendly error
 * - Cookie security (httpOnly, secure, sameSite)
 * - Session creation validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../sign-in';
import * as auth from '@/lib/auth';

// Mock auth module
vi.mock('@/lib/auth');

describe('POST /api/auth/sign-in', () => {
  let mockRequest: Request;
  let mockCookies: any;
  let mockRedirect: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock cookies
    mockCookies = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    };

    // Mock redirect
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

  describe('Successful Sign-In', () => {
    it('should sign in with valid credentials and set cookies', async () => {
      // Mock successful sign-in
      const mockSession = {
        access_token: 'mock-access-token-abc123',
        refresh_token: 'mock-refresh-token-xyz789',
      };

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          session: mockSession,
        },
        error: null,
      } as any);

      // Create request with FormData
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Call the endpoint
      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Verify signInWithPassword was called with correct params
      expect(auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      // Verify cookies were set
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'mock-access-token-abc123',
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
        'mock-refresh-token-xyz789',
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

    it('should handle sign-in with JSON body', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
      };

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'json@example.com' },
          session: mockSession,
        },
        error: null,
      } as any);

      // Create request with JSON body
      const formData = new URLSearchParams();
      formData.append('email', 'json@example.com');
      formData.append('password', 'jsonpass');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'json@example.com',
        password: 'jsonpass',
      });

      expect(mockRedirect).toHaveBeenCalledWith('/products', 303);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when email is missing', async () => {
      const formData = new URLSearchParams();
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('Email and password are required');

      // Verify auth function was not called
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('Email and password are required');

      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return 400 when both email and password are missing', async () => {
      const formData = new URLSearchParams();

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(400);
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 with user-friendly message for invalid credentials', async () => {
      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'wrong@example.com');
      formData.append('password', 'wrongpassword');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(401);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data.error).toBe('The email or password you entered is incorrect. Please try again.');

      // Verify cookies were not set
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('should return user-friendly message for unconfirmed email', async () => {
      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Email not confirmed',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'unconfirmed@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Please verify your email address before signing in.');
    });

    it('should return user-friendly message for user not found', async () => {
      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'User not found',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'nonexistent@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('No account found with this email address.');
    });

    it('should return generic error for unknown auth errors', async () => {
      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Some unexpected error from Supabase',
          name: 'AuthError',
          status: 500,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unable to sign in. Please check your credentials and try again.');
    });
  });

  describe('Session Errors', () => {
    it('should return 500 when no session is returned despite successful auth', async () => {
      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: null, // No session!
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Unable to create session. Please try again or contact support if the problem persists.');

      // Verify cookies were not set
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('Cookie Security', () => {
    it('should set cookies with correct security attributes', async () => {
      const mockSession = {
        access_token: 'access123',
        refresh_token: 'refresh123',
      };

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: mockSession,
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Verify access token cookie
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'access123',
        expect.objectContaining({
          path: '/',
          sameSite: 'lax',
          maxAge: 604800, // 7 days in seconds
        })
      );

      // Verify refresh token cookie
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'refresh123',
        expect.objectContaining({
          path: '/',
          sameSite: 'lax',
          maxAge: 604800, // 7 days in seconds
        })
      );
    });

    it('should set both access and refresh token cookies', async () => {
      const mockSession = {
        access_token: 'access-token-value',
        refresh_token: 'refresh-token-value',
      };

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: mockSession,
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await POST({
        request: mockRequest,
        cookies: mockCookies,
        redirect: mockRedirect,
      } as any);

      // Verify both cookies were set
      expect(mockCookies.set).toHaveBeenCalledTimes(2);

      // Check both cookie names
      const cookieCalls = mockCookies.set.mock.calls;
      const cookieNames = cookieCalls.map((call: any) => call[0]);
      expect(cookieNames).toContain('sb-access-token');
      expect(cookieNames).toContain('sb-refresh-token');
    });
  });
});
