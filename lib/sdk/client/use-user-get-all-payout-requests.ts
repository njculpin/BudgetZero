'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllPayoutRequests() {
  const supabase = createClient()

  async function getPayoutRequests(options?: {
    userId?: string
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .order('requested_at', { ascending: false })

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
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

  return { getPayoutRequests }
}
