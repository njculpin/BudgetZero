'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProjectComment() {
  const supabase = createClient()

  async function deleteProjectComment(id: string) {
    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProjectComment }
}
