import type { AstroCookies } from 'astro';
import { setSession } from './index';
import { getUserById } from '@/lib/data-access/users';
import { serverClient } from '@/lib/data-access/client';
import type { AuditLog } from '@/types';

export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify that the current user is authenticated and has admin role
 */
export const verifyAdmin = async (cookies: AstroCookies): Promise<AdminAuthResult> => {
  // Check authentication
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');

  if (!accessToken || !refreshToken) {
    return {
      authorized: false,
      error: 'Not authenticated',
    };
  }

  // Verify session
  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return {
        authorized: false,
        error: 'Invalid session',
      };
    }
  } catch (error) {
    return {
      authorized: false,
      error: 'Authentication failed',
    };
  }

  const userId = session.data.user.id;

  // Check if user has admin role
  const user = await getUserById(userId);

  if (!user) {
    return {
      authorized: false,
      error: 'User not found',
    };
  }

  if (user.role !== 'admin') {
    return {
      authorized: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    authorized: true,
    userId,
  };
};

export interface LogAdminActionParams {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the audit log
 */
export const logAdminAction = async (params: LogAdminActionParams): Promise<AuditLog | null> => {
  try {
    const { data, error } = await serverClient
      .from('audit_log')
      .insert({
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId || null,
        details: params.details || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log admin action:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error logging admin action:', error);
    return null;
  }
};

/**
 * Get recent audit log entries
 */
export const getAuditLog = async (params?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  limit?: number;
}): Promise<AuditLog[]> => {
  try {
    let query = serverClient
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params?.action) {
      query = query.eq('action', params.action);
    }

    if (params?.resourceType) {
      query = query.eq('resource_type', params.resourceType);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get audit log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting audit log:', error);
    return [];
  }
};
