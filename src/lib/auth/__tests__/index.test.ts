import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authClient } from '../client';

// Mock the entire client module
vi.mock('../client', () => ({
  authClient: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      setSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

// Import functions after mocking
import {
  signInWithPassword,
  signInWithOAuth,
  signUp,
  exchangeCodeForSession,
  signOut,
  getSession,
  getUser,
  setSession,
  resetPasswordForEmail,
  updatePassword,
} from '../index';

describe('Auth Abstraction Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('P0 ARCHITECTURE: SDK Isolation', () => {
    it('should expose auth functions without direct Supabase imports', () => {
      // Verify all auth functions are exported
      expect(typeof signInWithPassword).toBe('function');
      expect(typeof signInWithOAuth).toBe('function');
      expect(typeof signUp).toBe('function');
      expect(typeof exchangeCodeForSession).toBe('function');
      expect(typeof signOut).toBe('function');
      expect(typeof getSession).toBe('function');
      expect(typeof getUser).toBe('function');
      expect(typeof setSession).toBe('function');
      expect(typeof resetPasswordForEmail).toBe('function');
      expect(typeof updatePassword).toBe('function');
    });

    it('should not expose Supabase client directly', async () => {
      // This test verifies the abstraction layer hides implementation details
      // Only the abstraction layer functions should be exposed, not the client
      const authModule = await import('../index');

      // Should not export the Supabase client
      expect(authModule.authClient).toBeUndefined();
      expect((authModule as Record<string, unknown>).supabase).toBeUndefined();
    });
  });

  describe('signInWithPassword', () => {
    it('should call auth.signInWithPassword with email and password', async () => {
      const mockResponse = {
        data: { user: { id: '123', email: 'test@example.com' }, session: {} },
        error: null,
      };

      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue(mockResponse);

      const result = await signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(authClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should return error response on authentication failure', async () => {
      const mockError = {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      };

      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue(mockError as never);

      const result = await signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid credentials');
    });
  });

  describe('signInWithOAuth', () => {
    it('should call auth.signInWithOAuth with provider and redirectTo', async () => {
      const mockResponse = {
        data: { provider: 'google', url: 'https://oauth.url' },
        error: null,
      };

      vi.mocked(authClient.auth.signInWithOAuth).mockResolvedValue(mockResponse);

      const result = await signInWithOAuth({
        provider: 'google',
        redirectTo: 'https://example.com/callback',
      });

      expect(authClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'https://example.com/callback' },
      });

      expect(result).toEqual(mockResponse);
    });

    it('should support multiple OAuth providers', async () => {
      const mockResponse = {
        data: { provider: 'github', url: 'https://oauth.url' },
        error: null,
      };

      vi.mocked(authClient.auth.signInWithOAuth).mockResolvedValue(mockResponse);

      await signInWithOAuth({
        provider: 'github',
        redirectTo: 'https://example.com/callback',
      });

      expect(authClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: { redirectTo: 'https://example.com/callback' },
      });
    });
  });

  describe('signUp', () => {
    it('should call auth.signUp with email and password', async () => {
      const mockResponse = {
        data: { user: { id: '123', email: 'newuser@example.com' }, session: null },
        error: null,
      };

      vi.mocked(authClient.auth.signUp).mockResolvedValue(mockResponse);

      const result = await signUp({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(authClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should return error if email already exists', async () => {
      const mockError = {
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      };

      vi.mocked(authClient.auth.signUp).mockResolvedValue(mockError as never);

      const result = await signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('User already exists');
    });
  });

  describe('exchangeCodeForSession', () => {
    it('should call auth.exchangeCodeForSession with code', async () => {
      const mockResponse = {
        data: { session: { access_token: 'token123' }, user: { id: '123' } },
        error: null,
      };

      vi.mocked(authClient.auth.exchangeCodeForSession).mockResolvedValue(mockResponse);

      const result = await exchangeCodeForSession('oauth_code_123');

      expect(authClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid OAuth codes', async () => {
      const mockError = {
        data: { session: null, user: null },
        error: { message: 'Invalid code' },
      };

      vi.mocked(authClient.auth.exchangeCodeForSession).mockResolvedValue(mockError as never);

      const result = await exchangeCodeForSession('invalid_code');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid code');
    });
  });

  describe('signOut', () => {
    it('should call auth.signOut', async () => {
      const mockResponse = { error: null };

      vi.mocked(authClient.auth.signOut).mockResolvedValue(mockResponse);

      const result = await signOut();

      expect(authClient.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSession', () => {
    it('should call auth.getSession', async () => {
      const mockResponse = {
        data: { session: { access_token: 'token123', user: { id: '123' } } },
        error: null,
      };

      vi.mocked(authClient.auth.getSession).mockResolvedValue(mockResponse);

      const result = await getSession();

      expect(authClient.auth.getSession).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return null session if user not authenticated', async () => {
      const mockResponse = {
        data: { session: null },
        error: null,
      };

      vi.mocked(authClient.auth.getSession).mockResolvedValue(mockResponse);

      const result = await getSession();

      expect(result.data.session).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should call auth.getUser', async () => {
      const mockResponse = {
        data: { user: { id: '123', email: 'user@example.com' } },
        error: null,
      };

      vi.mocked(authClient.auth.getUser).mockResolvedValue(mockResponse);

      const result = await getUser();

      expect(authClient.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return error if no user authenticated', async () => {
      const mockError = {
        data: { user: null },
        error: { message: 'Not authenticated' },
      };

      vi.mocked(authClient.auth.getUser).mockResolvedValue(mockError as never);

      const result = await getUser();

      expect(result.error).toBeDefined();
    });
  });

  describe('setSession', () => {
    it('should call auth.setSession with tokens', async () => {
      const mockResponse = {
        data: { session: { access_token: 'new_token', refresh_token: 'refresh' }, user: {} },
        error: null,
      };

      vi.mocked(authClient.auth.setSession).mockResolvedValue(mockResponse);

      const result = await setSession({
        access_token: 'new_token',
        refresh_token: 'refresh',
      });

      expect(authClient.auth.setSession).toHaveBeenCalledWith({
        access_token: 'new_token',
        refresh_token: 'refresh',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid tokens', async () => {
      const mockError = {
        data: { session: null, user: null },
        error: { message: 'Invalid token' },
      };

      vi.mocked(authClient.auth.setSession).mockResolvedValue(mockError as never);

      const result = await setSession({
        access_token: 'invalid',
        refresh_token: 'invalid',
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('resetPasswordForEmail', () => {
    it('should call auth.resetPasswordForEmail with email and redirectTo', async () => {
      const mockResponse = { data: {}, error: null };

      vi.mocked(authClient.auth.resetPasswordForEmail).mockResolvedValue(mockResponse);

      // Mock window.location.origin for the test
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      const result = await resetPasswordForEmail({
        email: 'user@example.com',
        redirectTo: 'http://localhost:3000/reset',
      });

      expect(authClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        { redirectTo: 'http://localhost:3000/reset' }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should use default redirectTo if not provided', async () => {
      const mockResponse = { data: {}, error: null };

      vi.mocked(authClient.auth.resetPasswordForEmail).mockResolvedValue(mockResponse);

      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      await resetPasswordForEmail({ email: 'user@example.com' });

      expect(authClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        { redirectTo: 'http://localhost:3000/reset-password' }
      );
    });

    it('should return error for invalid email', async () => {
      const mockError = {
        data: {},
        error: { message: 'Invalid email' },
      };

      vi.mocked(authClient.auth.resetPasswordForEmail).mockResolvedValue(mockError);

      const result = await resetPasswordForEmail({ email: 'invalid-email' });

      expect(result.error).toBeDefined();
    });
  });

  describe('updatePassword', () => {
    it('should call auth.updateUser with new password', async () => {
      const mockResponse = {
        data: { user: { id: '123' } },
        error: null,
      };

      vi.mocked(authClient.auth.updateUser).mockResolvedValue(mockResponse);

      const result = await updatePassword({ password: 'newpassword123' });

      expect(authClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should return error if password update fails', async () => {
      const mockError = {
        data: { user: null },
        error: { message: 'Password must be at least 6 characters' },
      };

      vi.mocked(authClient.auth.updateUser).mockResolvedValue(mockError);

      const result = await updatePassword({ password: '123' });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('at least 6 characters');
    });
  });

  describe('Integration: Full Auth Flow', () => {
    it('should complete sign up -> sign in -> sign out flow', async () => {
      // Sign up
      const signUpResponse = {
        data: { user: { id: '123', email: 'flow@example.com' }, session: null },
        error: null,
      };
      vi.mocked(authClient.auth.signUp).mockResolvedValue(signUpResponse);

      const signUpResult = await signUp({
        email: 'flow@example.com',
        password: 'password123',
      });
      expect(signUpResult.data.user).toBeDefined();

      // Sign in
      const signInResponse = {
        data: {
          user: { id: '123', email: 'flow@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      };
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue(signInResponse);

      const signInResult = await signInWithPassword({
        email: 'flow@example.com',
        password: 'password123',
      });
      expect(signInResult.data.session).toBeDefined();

      // Get session
      const sessionResponse = {
        data: { session: { access_token: 'token123' } },
        error: null,
      };
      vi.mocked(authClient.auth.getSession).mockResolvedValue(sessionResponse);

      const sessionResult = await getSession();
      expect(sessionResult.data.session).toBeDefined();

      // Sign out
      const signOutResponse = { error: null };
      vi.mocked(authClient.auth.signOut).mockResolvedValue(signOutResponse);

      const signOutResult = await signOut();
      expect(signOutResult.error).toBeNull();
    });

    it('should complete OAuth flow', async () => {
      // Start OAuth
      const oauthResponse = {
        data: { provider: 'google', url: 'https://oauth.url' },
        error: null,
      };
      vi.mocked(authClient.auth.signInWithOAuth).mockResolvedValue(oauthResponse);

      const oauthResult = await signInWithOAuth({
        provider: 'google',
        redirectTo: 'http://localhost/callback',
      });
      expect(oauthResult.data.url).toBeDefined();

      // Exchange code for session
      const exchangeResponse = {
        data: {
          session: { access_token: 'oauth_token' },
          user: { id: '123', email: 'oauth@example.com' },
        },
        error: null,
      };
      vi.mocked(authClient.auth.exchangeCodeForSession).mockResolvedValue(exchangeResponse);

      const exchangeResult = await exchangeCodeForSession('oauth_code');
      expect(exchangeResult.data.session).toBeDefined();
      expect(exchangeResult.data.user).toBeDefined();
    });
  });
});
