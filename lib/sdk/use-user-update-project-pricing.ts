'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProjectPricing() {
  const supabase = createClient()

  async function updateProjectPricing(
    id: string,
    updates: {
      name?: string
      description?: string
      price_cents?: number
      is_active?: boolean
    }
  ) {
    const { data, error } = await supabase
      .from('project_pricing')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateProjectPricing }
}
