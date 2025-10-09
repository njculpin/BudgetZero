'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProjectComment() {
  const supabase = createClient()

  async function createProjectComment(comment: {
    project_id: string
    author_id: string
    content: string
  }) {
    const { data, error } = await supabase
      .from('project_comments')
      .insert(comment)
      .select(`
        *,
        author:author_id(id, full_name, username, avatar_url)
      `)
      .single()

    return { data, error }
  }

  return { createProjectComment }
}
