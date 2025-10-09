'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProjectTag() {
  const supabase = createClient()

  async function deleteProjectTag(id: string) {
    const { error } = await supabase
      .from('project_tags')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProjectTag }
}
