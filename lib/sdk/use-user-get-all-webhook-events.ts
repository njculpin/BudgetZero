'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllWebhookEvents() {
  const supabase = createClient()

  async function getWebhookEvents(options?: {
    eventType?: string
    processed?: boolean
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('webhook_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType)
    }

    if (options?.processed !== undefined) {
      query = query.eq('processed', options.processed)
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

  return { getWebhookEvents }
}
