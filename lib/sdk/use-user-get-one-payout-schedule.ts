'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetOnePayoutSchedule() {
  const supabase = createClient()

  async function getPayoutSchedule(userId: string) {
    const { data, error } = await supabase
      .from('payout_schedules')
      .select('*')
      .eq('user_id', userId)
      .single()

    return { data, error }
  }

  return { getPayoutSchedule }
}
