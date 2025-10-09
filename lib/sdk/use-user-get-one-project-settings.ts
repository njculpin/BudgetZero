'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetOneProjectSettings() {
  const supabase = createClient()

  async function getProjectSettings(project_id: string) {
    const { data, error } = await supabase
      .from('project_settings')
      .select('*')
      .eq('project_id', project_id)
      .single()

    return { data, error }
  }

  return { getProjectSettings }
}
