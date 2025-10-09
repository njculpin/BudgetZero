'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProjectComments() {
  const supabase = createClient()

  async function getProjectComments(projectId: string, options?: {
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('project_comments')
      .select(`
        *,
        author:author_id(id, full_name, username, avatar_url)
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    return { data, error, count }
  }

  return { getProjectComments }
}
