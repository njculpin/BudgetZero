import { getUserById } from '../data-access/users';
import { serverClient } from '../data-access/client';
import type { AuditLog } from '../types';

export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify that a caller is signed in and holds the admin role.
 *
 * Takes an already-resolved user id rather than cookies. It used to repeat the
 * whole cookie-to-session exchange itself, which meant an admin request paid for
 * that network round trip a third time — after the middleware and after the
 * route had each done it. Identity is settled once, at the gateway; this only
 * answers the question it is named for.
 */
export const verifyAdmin = async (userId: string | null): Promise<AdminAuthResult> => {
  if (!userId) {
    return {
      authorized: false,
      error: 'Not authenticated',
    };
  }


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
