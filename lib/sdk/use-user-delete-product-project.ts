'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProductProject() {
  const supabase = createClient()

  async function deleteProductProject(id: string) {
    const { error } = await supabase
      .from('product_projects')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProductProject }
}
