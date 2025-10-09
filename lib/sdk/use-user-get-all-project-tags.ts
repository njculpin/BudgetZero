'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProjectTags() {
  const supabase = createClient()

  async function getProjectTags(project_id: string) {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .eq('project_id', project_id)
      .order('tag', { ascending: true })

    return { data, error }
  }

  return { getProjectTags }
}
