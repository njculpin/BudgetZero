'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProjectChat() {
  const supabase = createClient()

  async function createProjectChatMessage(message: {
    project_id: string
    author_id: string
    message: string
  }) {
    const { data, error } = await supabase
      .from('project_chat')
      .insert(message)
      .select(`
        *,
        author:author_id(id, full_name, username, avatar_url)
      `)
      .single()

    return { data, error }
  }

  return { createProjectChatMessage }
}
