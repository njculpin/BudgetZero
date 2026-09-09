import type { AuthError, Session, User } from '@supabase/supabase-js';

/**
 * Test fixtures for Supabase auth shapes.
 *
 * Supabase's `User` and `Session` carry a dozen required fields that no test cares
 * about, so tests were passing object literals with two or three of them and failing
 * to typecheck. These builders supply complete, valid defaults and let each test
 * override only what it is actually asserting on.
 *
 * This file lives under src/test/ rather than a __tests__ directory so it is shared
 * infrastructure, not itself a suite.
 */

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    email: 'test@example.com',
    ...overrides,
  } as User;
}

export function mockSession(overrides: Partial<Session> = {}): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser(),
    ...overrides,
  } as Session;
}

/**
 * A structurally valid `AuthError`. Tests were passing `{ message }` literals, which
 * omit the `code`, `status`, `name` and `__isAuthError` fields the type requires.
 */
export function mockAuthError(message: string, status = 400): AuthError {
  return {
    name: 'AuthApiError',
    message,
    status,
    code: 'invalid_request',
    __isAuthError: true,
  } as unknown as AuthError;
}
