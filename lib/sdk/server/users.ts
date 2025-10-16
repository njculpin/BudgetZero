import type { TablesInsert, TablesUpdate, Tables } from '@/lib/types/database';
import type { ApiResponse, DbClient, PaginatedResponse, PaginationParams } from '../shared/types';
import { calculatePagination, failure, success } from '../shared/utils';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Auth Helpers
export async function getMe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return user;
}

// Get user profile with extended data
export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}

// Get current user's profile (combines auth + profile data)
export async function getMyProfile() {
  const user = await getMe();
  const { data: profile } = await getUserProfile(user.id);

  return {
    ...user,
    profile,
  };
}

// Users CRUD
export async function createUser(
  client: DbClient,
  data: TablesInsert<'users'>
): Promise<ApiResponse<Tables<'users'>>> {
  try {
    const { data: user, error } = await client
      .from('users')
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(user);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserById(
  client: DbClient,
  id: string
): Promise<ApiResponse<Tables<'users'>>> {
  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserByEmail(
  client: DbClient,
  email: string
): Promise<ApiResponse<Tables<'users'>>> {
  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserByUsername(
  client: DbClient,
  username: string
): Promise<ApiResponse<Tables<'users'>>> {
  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateUser(
  client: DbClient,
  id: string,
  data: TablesUpdate<'users'>
): Promise<ApiResponse<Tables<'users'>>> {
  try {
    const { data: user, error } = await client
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(user);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteUser(
  client: DbClient,
  id: string
): Promise<ApiResponse<Tables<'users'>>> {
  try {
    const { data, error } = await client
      .from('users')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function listUsers(
  client: DbClient,
  params?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Tables<'users'>>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from('users')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

// User Addresses CRUD
export async function createUserAddress(
  client: DbClient,
  data: TablesInsert<'user_addresses'>
): Promise<ApiResponse<Tables<'user_addresses'>>> {
  try {
    const { data: address, error } = await client
      .from('user_addresses')
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(address);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserAddresses(
  client: DbClient,
  userId: string
): Promise<ApiResponse<Tables<'user_addresses'>[]>> {
  try {
    const { data, error } = await client
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('is_primary', { ascending: false });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserAddress(
  client: DbClient,
  id: number,
  data: TablesUpdate<'user_addresses'>
): Promise<ApiResponse<Tables<'user_addresses'>>> {
  try {
    const { data: address, error } = await client
      .from('user_addresses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(address);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteUserAddress(
  client: DbClient,
  id: number
): Promise<ApiResponse<Tables<'user_addresses'>>> {
  try {
    const { data, error } = await client
      .from('user_addresses')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// User Stripe Accounts CRUD
export async function createUserStripeAccount(
  client: DbClient,
  data: TablesInsert<'user_stripe_accounts'>
): Promise<ApiResponse<Tables<'user_stripe_accounts'>>> {
  try {
    const { data: account, error } = await client
      .from('user_stripe_accounts')
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(account);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserStripeAccount(
  client: DbClient,
  userId: string
): Promise<ApiResponse<Tables<'user_stripe_accounts'>>> {
  try {
    const { data, error } = await client
      .from('user_stripe_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserStripeAccount(
  client: DbClient,
  id: string,
  data: TablesUpdate<'user_stripe_accounts'>
): Promise<ApiResponse<Tables<'user_stripe_accounts'>>> {
  try {
    const { data: account, error } = await client
      .from('user_stripe_accounts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(account);
  } catch (error) {
    return failure(error);
  }
}

// User Payouts CRUD
export async function createUserPayout(
  client: DbClient,
  data: TablesInsert<'user_payouts'>
): Promise<ApiResponse<Tables<'user_payouts'>>> {
  try {
    const { data: payout, error } = await client
      .from('user_payouts')
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(payout);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserPayouts(
  client: DbClient,
  userId: string,
  params?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Tables<'user_payouts'>>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from('user_payouts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserPayout(
  client: DbClient,
  id: string,
  data: TablesUpdate<'user_payouts'>
): Promise<ApiResponse<Tables<'user_payouts'>>> {
  try {
    const { data: payout, error } = await client
      .from('user_payouts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(payout);
  } catch (error) {
    return failure(error);
  }
}

// User Stripe Invoices CRUD
export async function createUserStripeInvoice(
  client: DbClient,
  data: TablesInsert<'user_stripe_invoices'>
): Promise<ApiResponse<Tables<'user_stripe_invoices'>>> {
  try {
    const { data: invoice, error } = await client
      .from('user_stripe_invoices')
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(invoice);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserStripeInvoices(
  client: DbClient,
  userId: string,
  params?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Tables<'user_stripe_invoices'>>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from('user_stripe_invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserStripeInvoice(
  client: DbClient,
  id: number,
  data: TablesUpdate<'user_stripe_invoices'>
): Promise<ApiResponse<Tables<'user_stripe_invoices'>>> {
  try {
    const { data: invoice, error} = await client
      .from('user_stripe_invoices')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return failure(error);
    return success(invoice);
  } catch (error) {
    return failure(error);
  }
}
