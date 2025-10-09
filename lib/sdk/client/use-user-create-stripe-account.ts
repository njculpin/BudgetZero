'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateStripeAccount() {
  const supabase = createClient()

  async function createStripeAccount(account: {
    user_id: string
    stripe_account_id: string
    account_type: 'express' | 'standard'
    charges_enabled?: boolean
    payouts_enabled?: boolean
    details_submitted?: boolean
    country?: string
    currency?: string
  }) {
    const { data, error } = await supabase
      .from('stripe_connected_accounts')
      .insert(account)
      .select()
      .single()

    return { data, error }
  }

  return { createStripeAccount }
}
