'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllNotifications() {
  const supabase = createClient()

  async function getNotifications(userId: string, options?: {
    notificationType?: 'asset_reference_request' | 'asset_reference_approved' | 'asset_reference_rejected' | 'collaborator_invite' | 'collaborator_joined' | 'project_published' | 'order_received' | 'payout_completed' | 'payout_failed'
    isRead?: boolean
    resourceType?: 'project' | 'asset' | 'order' | 'payout' | 'collaborator'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.notificationType) {
      query = query.eq('notification_type', options.notificationType)
    }

    if (options?.isRead !== undefined) {
      query = query.eq('is_read', options.isRead)
    }

    if (options?.resourceType) {
      query = query.eq('resource_type', options.resourceType)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    return { data, error, count }
  }

  return { getNotifications }
}
