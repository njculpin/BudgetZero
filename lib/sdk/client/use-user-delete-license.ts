'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteLicense() {
  const supabase = createClient()

  async function deleteLicense(id: string) {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteLicense }
}
