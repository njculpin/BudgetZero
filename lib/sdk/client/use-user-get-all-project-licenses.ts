'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProjectLicenses() {
  const supabase = createClient()

  async function getProjectLicenses(project_id: string) {
    const { data, error } = await supabase
      .from('project_licenses')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  return { getProjectLicenses }
}
