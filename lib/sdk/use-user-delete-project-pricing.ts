'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProjectPricing() {
  const supabase = createClient()

  async function deleteProjectPricing(id: string) {
    const { error } = await supabase
      .from('project_pricing')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProjectPricing }
}
