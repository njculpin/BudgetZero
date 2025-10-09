'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProjectComment() {
  const supabase = createClient()

  async function updateProjectComment(
    id: string,
    updates: {
      content?: string
    }
  ) {
    const { data, error } = await supabase
      .from('project_comments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        author:author_id(id, full_name, username, avatar_url)
      `)
      .single()

    return { data, error }
  }

  return { updateProjectComment }
}
