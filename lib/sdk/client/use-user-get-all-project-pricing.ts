'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProjectPricing() {
  const supabase = createClient()

  async function getProjectPricing(projectId: string, options?: {
    isActive?: boolean
  }) {
    let query = supabase
      .from('project_pricing')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    const { data, error } = await query

    return { data, error }
  }

  return { getProjectPricing }
}
