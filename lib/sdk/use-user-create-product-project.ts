'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProductProject() {
  const supabase = createClient()

  async function createProductProject(data: {
    product_id: string
    project_id: string
    display_order?: number
  }) {
    const { data: result, error } = await supabase
      .from('product_projects')
      .insert(data)
      .select()
      .single()

    return { data: result, error }
  }

  return { createProductProject }
}
