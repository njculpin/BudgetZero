import { authClient } from "./client";
import type { Provider } from "@supabase/supabase-js";

// Re-export types to maintain SDK isolation
export type { Provider } from "@supabase/supabase-js";

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: Provider;
  redirectTo: string;
}

export interface SignUpParams {
  email: string;
  password: string;
}

export const signInWithPassword = async ({ email, password }: SignInWithPasswordParams) => {
  return authClient.auth.signInWithPassword({ email, password });
};

export const signInWithOAuth = async ({ provider, redirectTo }: SignInWithOAuthParams) => {
  return authClient.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
};

export const signUp = async ({ email, password }: SignUpParams) => {
  return authClient.auth.signUp({ email, password });
};

export const exchangeCodeForSession = async (code: string) => {
  return authClient.auth.exchangeCodeForSession(code);
};

export const signOut = async () => {
  return authClient.auth.signOut();
};

export const getSession = async () => {
  return authClient.auth.getSession();
};

export const getUser = async () => {
  return authClient.auth.getUser();
};

export const setSession = async (params: { access_token: string; refresh_token: string }) => {
  return authClient.auth.setSession(params);
};

export interface ResetPasswordParams {
  email: string;
  redirectTo?: string;
}

export const resetPasswordForEmail = async ({ email, redirectTo }: ResetPasswordParams) => {
  return authClient.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/reset-password`,
  });
};

export interface UpdatePasswordParams {
  password: string;
}

export const updatePassword = async ({ password }: UpdatePasswordParams) => {
  return authClient.auth.updateUser({ password });
};
