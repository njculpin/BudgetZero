'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllUserAddresses() {
  const supabase = createClient()

  async function getUserAddresses(userId: string, options?: {
    addressType?: 'shipping' | 'billing' | 'both'
    isPrimary?: boolean
  }) {
    let query = supabase
      .from('users_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.addressType) {
      query = query.eq('address_type', options.addressType)
    }

    if (options?.isPrimary !== undefined) {
      query = query.eq('is_primary', options.isPrimary)
    }

    const { data, error } = await query

    return { data, error }
  }

  return { getUserAddresses }
}
