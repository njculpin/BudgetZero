'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateLicense() {
  const supabase = createClient()

  async function createLicense(license: {
    creator_id?: string
    title: string
    agreement: string
    is_platform_default?: boolean
  }) {
    const { data, error } = await supabase
      .from('licenses')
      .insert(license)
      .select(`
        *,
        creator:creator_id(id, full_name, username)
      `)
      .single()

    return { data, error }
  }

  return { createLicense }
}
