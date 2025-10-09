'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllOrderRevenueSplits() {
  const supabase = createClient()

  async function getOrderRevenueSplits(options?: {
    orderId?: string
    recipientId?: string
    splitType?: 'platform_fee' | 'asset_royalty' | 'collaborator_share' | 'project_creator'
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('order_revenue_splits')
      .select(`
        *,
        order:order_id(id, order_number, total_cents),
        recipient:recipient_id(id, full_name, username, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.orderId) {
      query = query.eq('order_id', options.orderId)
    }

    if (options?.recipientId) {
      query = query.eq('recipient_id', options.recipientId)
    }

    if (options?.splitType) {
      query = query.eq('split_type', options.splitType)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
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

  return { getOrderRevenueSplits }
}
