'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreatePayoutSchedule() {
  const supabase = createClient()

  async function createPayoutSchedule(schedule: {
    user_id: string
    enabled?: boolean
    frequency?: 'weekly' | 'biweekly' | 'monthly'
    minimum_amount?: number
    day_of_month?: number
    last_payout_at?: string
    next_payout_at?: string
  }) {
    const { data, error } = await supabase
      .from('payout_schedules')
      .insert(schedule)
      .select()
      .single()

    return { data, error }
  }

  return { createPayoutSchedule }
}
