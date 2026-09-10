import { makeContext } from '@gameloopers/api/test-support';
/**
 * Sign-Up Endpoint Tests
 *
 * Tests for /api/auth/sign-up (POST)
 *
 * Coverage:
 * - Successful registration with auto-login
 * - Duplicate email rejection
 * - Password validation errors
 * - Email validation errors
 * - Welcome email sending
 * - Cookie setting after auto-login
 * - Fallback to manual sign-in if auto-login fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authSignUp } from '@gameloopers/api/controllers/auth/sign-up';
import * as auth from '@gameloopers/core/auth';
import * as email from '@gameloopers/core/email';

/** Where a 3xx response points, or null when it is not a redirect. */
function redirectTarget(response: Response): string | null {
  return response.status >= 300 && response.status < 400
    ? response.headers.get('Location')
    : null;
}

// Mock auth and email modules
vi.mock('@gameloopers/core/auth');

// The rate limiter has its own tests in src/lib/rate-limit/__tests__. These tests
// exercise auth logic, and the suite makes far more sign-in attempts than a real
// client would — without this the shared quota is exhausted partway through and
// every later test gets a 429 before reaching the code under test.
vi.mock('@gameloopers/core/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@gameloopers/core/rate-limit')>()),
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    retryAfterSeconds: 0,
  }),
}));

vi.mock('@gameloopers/core/email');

describe('POST /api/auth/sign-up', () => {
  let mockRequest: Request;
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

    // Mock successful email sending by default
    vi.mocked(email.sendEmail).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Sign-Up', () => {
    it('should register user, auto-login, send welcome email, and redirect', async () => {
      const testEmail = 'newuser@example.com';
      const testPassword = 'SecurePass123!';

      // Mock successful sign-up
      vi.mocked(auth.signUp).mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: testEmail },
          session: null,
        },
        error: null,
      } as any);

      // Mock successful auto-login
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: testEmail },
          session: mockSession,
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', testEmail);
      formData.append('password', testPassword);

      mockRequest = new Request('http://localhost:4321/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      // Verify signUp was called
      expect(auth.signUp).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
      });

      // Verify auto-login was attempted
      expect(auth.signInWithPassword).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
      });

      // Verify cookies were set
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'new-access-token',
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        })
      );

      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'new-refresh-token',
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        })
      );

      // Verify welcome email was sent
      expect(email.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: 'Welcome to Game Loopers!',
          from: 'Game Loopers <noreply@gameloopers.com>',
        })
      );

      // Verify redirect to products
      expect(redirectTarget(response)).toBe('/products');
    });

    it('should set secure cookies in production mode', async () => {
      // NODE_ENV is what the cookie writer consults; mutating this module's
      // import.meta.env would not reach the gateway's copy.
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: null },
        error: null,
      } as any);

      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
      };

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: mockSession },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      // Assert the concrete value, not `import.meta.env.PROD`. Comparing the
      // result against the same variable that produced it passed whatever the
      // code did, which is how `secure: false` went unnoticed in sign-in and the
      // OAuth callback.
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'token123',
        expect.objectContaining({ secure: true })
      );
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'refresh123',
        expect.objectContaining({ secure: true })
      );

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should send welcome email with correct content', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'welcome@example.com' }, session: null },
        error: null,
      } as any);

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'welcome@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'welcome@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost:4321/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      const emailCall = vi.mocked(email.sendEmail).mock.calls[0][0];

      // Verify email content
      expect(emailCall.to).toBe('welcome@example.com');
      expect(emailCall.subject).toBe('Welcome to Game Loopers!');
      expect(emailCall.html).toContain('Welcome to Game Loopers!');
      expect(emailCall.html).toContain('tabletop game creators');
      expect(emailCall.html).toContain('http://localhost:4321/settings');
      expect(emailCall.html).toContain('http://localhost:4321/products');
      expect(emailCall.text).toContain('Welcome to Game Loopers!');
    });

    it('should not fail registration if welcome email fails', async () => {
      // Mock email failure
      vi.mocked(email.sendEmail).mockRejectedValue(new Error('Email service down'));

      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: null },
        error: null,
      } as any);

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      // Should still redirect successfully
      expect(redirectTarget(response)).toBe('/products');

      // Verify email was attempted
      expect(email.sendEmail).toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when email is missing', async () => {
      const formData = new URLSearchParams();
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data.error).toBe('Email and password are required');

      // Verify signUp was not called
      expect(auth.signUp).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Email and password are required');

      expect(auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe('Registration Errors', () => {
    it('should return 400 for duplicate email', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'User already registered',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'existing@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('An account with this email already exists. Please sign in instead.');

      // Verify no cookies were set
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('should return user-friendly message for invalid email', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid email',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'notanemail');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Please enter a valid email address');
    });

    it('should return user-friendly message for weak password (too short)', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Password should be at least 6 characters',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', '123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Password must be at least 6 characters long');
    });

    it('should return user-friendly message for weak password (missing characters)', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Password should contain at least one character of each type',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'weakpassword');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Password must include: lowercase letter, uppercase letter, number, and special character (!@#$%^&* etc.)');
    });

    it('should return original error for unknown sign-up errors', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Some unknown error from Supabase',
          name: 'AuthError',
          status: 500,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Some unknown error from Supabase');
    });
  });

  describe('Auto-Login Fallback', () => {
    it('should redirect to sign-in page if auto-login fails', async () => {
      // Successful sign-up
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: null },
        error: null,
      } as any);

      // Failed auto-login
      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Auto-login failed',
          name: 'AuthError',
          status: 400,
        },
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      // Should redirect to sign-in with message
      expect(redirectTarget(response)).toBe('/sign-in?message=Account created. Please sign in.');

      // Verify no cookies were set (since auto-login failed)
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('should redirect to sign-in if auto-login returns no session', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: null },
        error: null,
      } as any);

      // Auto-login succeeds but no session
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

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      expect(redirectTarget(response)).toBe('/sign-in?message=Account created. Please sign in.');
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('Cookie Settings', () => {
    it('should set cookies with correct maxAge', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: null },
        error: null,
      } as any);

      vi.mocked(auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'access', refresh_token: 'refresh' },
        },
        error: null,
      } as any);

      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      mockRequest = new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const response = await authSignUp(makeContext({ request: mockRequest, cookies: mockCookies }));

      // Verify access token: 7 days
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'access',
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      );

      // Verify refresh token: 30 days
      expect(mockCookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'refresh',
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      );
    });
  });
});
